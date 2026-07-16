import pg from 'pg';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Conexión a PostgreSQL: variable de entorno DATABASE_URL (Render) o
// archivo local data/db-config.json (gitignored). Sin ninguna de las
// dos, los pedidos se guardan en orders.json como hasta ahora.
const rutaConfig = join(__dirname, 'data', 'db-config.json');
const DATABASE_URL =
  process.env.DATABASE_URL ??
  (existsSync(rutaConfig)
    ? JSON.parse(readFileSync(rutaConfig, 'utf-8')).databaseUrl
    : null);

// TLS de la conexión a PostgreSQL. Por defecto se cifra pero no se
// verifica el certificado (rejectUnauthorized:false), que es lo que
// admiten de fábrica los Postgres gestionados como el de Render. Para
// endurecerlo frente a un MITM, define DATABASE_CA con el certificado
// del proveedor (verificación completa) o DATABASE_SSL_STRICT=1.
const sslConfig = () => {
  if (DATABASE_URL.includes('localhost')) return false;
  if (process.env.DATABASE_CA) {
    return { ca: process.env.DATABASE_CA, rejectUnauthorized: true };
  }
  return { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === '1' };
};

const pool = DATABASE_URL
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: sslConfig(),
    })
  : null;

export const usandoBd = Boolean(pool);

// Crea la tabla de pedidos si no existe. Se llama al arrancar.
export async function inicializarBd() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id TEXT PRIMARY KEY,
      fecha TIMESTAMPTZ NOT NULL,
      datos JSONB NOT NULL
    )
  `);
  // Índice único sobre la sesión de Stripe: garantiza que el webhook y
  // la página de éxito no puedan registrar el mismo pago dos veces. Si
  // la tabla ya tuviera duplicados de antes (de la ventana de carrera
  // previa a este índice), la creación fallaría: en ese caso se avisa y
  // se continúa —el chequeo a nivel de app sigue deduplicando— en vez
  // de impedir el arranque del servidor.
  try {
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS pedidos_stripe_session
      ON pedidos ((datos->>'stripeSession'))
      WHERE datos->>'stripeSession' IS NOT NULL
    `);
  } catch (err) {
    console.error(
      'No se pudo crear el índice único pedidos_stripe_session (¿hay ' +
        'pedidos duplicados por la misma sesión de Stripe?). El servidor ' +
        'sigue arrancando; deduplica la tabla y reinicia. Detalle:',
      err.message
    );
  }
}

const rutaJson = join(__dirname, 'data', 'orders.json');
const leerJson = () =>
  existsSync(rutaJson) ? JSON.parse(readFileSync(rutaJson, 'utf-8')) : [];

// Devuelve true si el pedido se insertó de verdad, o false si esa
// sesión de Stripe ya estaba registrada (carrera webhook / página de
// éxito). El llamante usa el booleano para no duplicar emails y avisos.
export async function guardarPedidoBd(pedido) {
  if (pool) {
    // Si otro proceso ya registró esta misma sesión de Stripe, la
    // inserción se ignora sin fallar (rowCount === 0).
    const r = await pool.query(
      `INSERT INTO pedidos (id, fecha, datos) VALUES ($1, $2, $3)
       ON CONFLICT ((datos->>'stripeSession')) WHERE datos->>'stripeSession' IS NOT NULL
       DO NOTHING`,
      [pedido.id, pedido.fecha, pedido]
    );
    return r.rowCount > 0;
  }
  const pedidos = leerJson();
  // Mismo guard en el fallback JSON: releer antes de escribir por si
  // la sesión ya quedó registrada entre la comprobación y el guardado.
  if (pedido.stripeSession && pedidos.some((p) => p.stripeSession === pedido.stripeSession)) {
    return false;
  }
  pedidos.push(pedido);
  writeFileSync(rutaJson, JSON.stringify(pedidos, null, 2));
  return true;
}

export async function listarPedidos() {
  if (pool) {
    const r = await pool.query('SELECT datos FROM pedidos ORDER BY fecha ASC');
    return r.rows.map((row) => row.datos);
  }
  return leerJson();
}

export async function buscarPorId(id) {
  if (pool) {
    const r = await pool.query('SELECT datos FROM pedidos WHERE id = $1 LIMIT 1', [id]);
    return r.rows[0]?.datos ?? null;
  }
  return leerJson().find((p) => p.id === id) ?? null;
}

export async function buscarPorStripeSession(sessionId) {
  if (pool) {
    const r = await pool.query(
      "SELECT datos FROM pedidos WHERE datos->>'stripeSession' = $1 LIMIT 1",
      [sessionId]
    );
    return r.rows[0]?.datos ?? null;
  }
  return leerJson().find((p) => p.stripeSession === sessionId) ?? null;
}

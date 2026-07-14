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

const pool = DATABASE_URL
  ? new pg.Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
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
}

const rutaJson = join(__dirname, 'data', 'orders.json');
const leerJson = () =>
  existsSync(rutaJson) ? JSON.parse(readFileSync(rutaJson, 'utf-8')) : [];

export async function guardarPedidoBd(pedido) {
  if (pool) {
    await pool.query(
      'INSERT INTO pedidos (id, fecha, datos) VALUES ($1, $2, $3)',
      [pedido.id, pedido.fecha, pedido]
    );
    return;
  }
  const pedidos = leerJson();
  pedidos.push(pedido);
  writeFileSync(rutaJson, JSON.stringify(pedidos, null, 2));
}

export async function listarPedidos() {
  if (pool) {
    const r = await pool.query('SELECT datos FROM pedidos ORDER BY fecha ASC');
    return r.rows.map((row) => row.datos);
  }
  return leerJson();
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

import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomBytes, timingSafeEqual } from 'crypto';
import { enviarConfirmacion, enviarAvisoVenta } from './email.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// Contraseña del panel de administración. Se lee de la variable de
// entorno ADMIN_PASSWORD o del archivo data/admin-password.txt (que
// está en .gitignore para que nunca se suba al repositorio).
const rutaPassword = join(__dirname, 'data', 'admin-password.txt');
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ??
  (existsSync(rutaPassword) ? readFileSync(rutaPassword, 'utf-8').trim() : 'chargeup123');

// Sesiones en memoria: token -> fecha de caducidad (8 horas).
// Se pierden al reiniciar el servidor; basta con volver a entrar.
const SESION_MS = 8 * 60 * 60 * 1000;
const sesiones = new Map();

const app = express();
app.use(cors());
app.use(express.json());

// Los datos se leen en cada petición para que editar los JSON
// surta efecto sin reiniciar el servidor.
const loadJson = (file) =>
  JSON.parse(readFileSync(join(__dirname, 'data', file), 'utf-8'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'chargeup-server' });
});

// Oferta destacada que muestra el banner de la web
app.get('/api/offer', (_req, res) => {
  res.json(loadJson('offer.json'));
});

// Catálogo de productos
app.get('/api/products', (_req, res) => {
  res.json(loadJson('products.json'));
});

// Inicio de sesión del panel: si la contraseña es correcta devuelve
// un token que el cliente debe enviar en la cabecera Authorization.
app.post('/api/login', (req, res) => {
  const intento = Buffer.from(String(req.body?.password ?? ''));
  const real = Buffer.from(ADMIN_PASSWORD);
  const valida = intento.length === real.length && timingSafeEqual(intento, real);
  if (!valida) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  const token = randomBytes(32).toString('hex');
  sesiones.set(token, Date.now() + SESION_MS);
  res.json({ token });
});

// Middleware que exige un token de sesión válido.
const requiereAdmin = (req, res, next) => {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
  const caducidad = sesiones.get(token);
  if (!caducidad || caducidad < Date.now()) {
    sesiones.delete(token);
    return res.status(401).json({ error: 'Sesión no válida o caducada' });
  }
  next();
};

// Listado de pedidos para el panel de administración (protegido).
app.get('/api/orders', requiereAdmin, (_req, res) => {
  const rutaPedidos = join(__dirname, 'data', 'orders.json');
  res.json(existsSync(rutaPedidos) ? loadJson('orders.json') : []);
});

// Crear un pedido. Los precios se recalculan aquí con el catálogo
// para que el cliente no pueda manipularlos.
app.post('/api/orders', (req, res) => {
  const { cliente = {}, items = [] } = req.body ?? {};

  const obligatorios = ['nombre', 'email', 'direccion', 'ciudad', 'cp'];
  const faltan = obligatorios.filter((c) => !String(cliente[c] ?? '').trim());
  if (faltan.length > 0) {
    return res.status(400).json({ error: `Faltan datos: ${faltan.join(', ')}` });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  const catalogo = loadJson('products.json');
  const lineas = [];
  for (const { id, qty } of items) {
    const producto = catalogo.find((p) => p.id === id);
    const cantidad = Number(qty);
    if (!producto || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
      return res.status(400).json({ error: 'Producto o cantidad no válidos' });
    }
    lineas.push({
      id,
      nombre: producto.nombre,
      precio: producto.precio,
      qty: cantidad,
      subtotal: +(producto.precio * cantidad).toFixed(2),
    });
  }

  const subtotal = +lineas.reduce((s, l) => s + l.subtotal, 0).toFixed(2);
  const envio = subtotal >= 25 ? 0 : 4.99;
  const total = +(subtotal + envio).toFixed(2);

  const rutaPedidos = join(__dirname, 'data', 'orders.json');
  const pedidos = existsSync(rutaPedidos) ? loadJson('orders.json') : [];

  const pedido = {
    id: 'CU-' + Date.now().toString(36).toUpperCase(),
    fecha: new Date().toISOString(),
    cliente: {
      nombre: String(cliente.nombre).trim(),
      email: String(cliente.email).trim(),
      telefono: String(cliente.telefono ?? '').trim(),
      direccion: String(cliente.direccion).trim(),
      ciudad: String(cliente.ciudad).trim(),
      cp: String(cliente.cp).trim(),
    },
    lineas,
    subtotal,
    envio,
    total,
  };

  pedidos.push(pedido);
  writeFileSync(rutaPedidos, JSON.stringify(pedidos, null, 2));

  // El email se envía en segundo plano: si falla, el pedido ya está
  // guardado y el cliente no ve ningún error.
  enviarConfirmacion(pedido)
    .then((r) =>
      console.log(
        r.enviado
          ? `Email de confirmación enviado a ${r.destino} (${pedido.id})`
          : `Email de ${pedido.id} guardado en ${r.archivo} (envío real desactivado)`
      )
    )
    .catch((err) =>
      console.error(`No se pudo enviar el email de ${pedido.id}:`, err.message)
    );

  // Aviso de venta al dueño de la tienda (notificación en el móvil vía Gmail)
  enviarAvisoVenta(pedido)
    .then((r) =>
      console.log(
        r.enviado
          ? `Aviso de venta enviado a ${r.destino} (${pedido.id})`
          : `Aviso de venta de ${pedido.id} guardado en ${r.archivo} (envío real desactivado)`
      )
    )
    .catch((err) =>
      console.error(`No se pudo enviar el aviso de venta de ${pedido.id}:`, err.message)
    );

  res.status(201).json({ id: pedido.id, total: pedido.total });
});

app.listen(PORT, () => {
  console.log(`ChargeUp API escuchando en http://localhost:${PORT}`);
});

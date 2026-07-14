import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { randomBytes, timingSafeEqual } from 'crypto';
import { enviarConfirmacion, enviarAvisoVenta, probarEmail } from './email.js';
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

// Clave secreta de Stripe: variable de entorno o archivo local (gitignored).
// Sin ella, el pago con tarjeta queda desactivado y solo hay contra reembolso.
const rutaStripe = join(__dirname, 'data', 'stripe-config.json');
const STRIPE_SECRET =
  process.env.STRIPE_SECRET_KEY ??
  (existsSync(rutaStripe)
    ? JSON.parse(readFileSync(rutaStripe, 'utf-8')).secretKey
    : null);
const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET) : null;

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

// Diagnóstico de la configuración de email (protegido): comprueba la
// conexión sin enviar ningún correo.
app.get('/api/email-test', requiereAdmin, async (req, res) => {
  res.json(await probarEmail(req.query.port));
});

// Listado de pedidos para el panel de administración (protegido).
app.get('/api/orders', requiereAdmin, (_req, res) => {
  const rutaPedidos = join(__dirname, 'data', 'orders.json');
  res.json(existsSync(rutaPedidos) ? loadJson('orders.json') : []);
});

// Valida cliente e items y calcula las líneas con los precios del
// catálogo, para que el cliente no pueda manipularlos.
// Devuelve { error } o { lineas, subtotal, envio, total }.
const validarPedido = (cliente = {}, items = []) => {
  const obligatorios = ['nombre', 'email', 'direccion', 'ciudad', 'cp'];
  const faltan = obligatorios.filter((c) => !String(cliente[c] ?? '').trim());
  if (faltan.length > 0) return { error: `Faltan datos: ${faltan.join(', ')}` };
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'El carrito está vacío' };
  }

  const catalogo = loadJson('products.json');
  const lineas = [];
  for (const { id, qty } of items) {
    const producto = catalogo.find((p) => p.id === id);
    const cantidad = Number(qty);
    if (!producto || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
      return { error: 'Producto o cantidad no válidos' };
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
  return { lineas, subtotal, envio, total };
};

// Guarda el pedido en orders.json y lanza los emails en segundo plano.
const guardarPedido = ({ cliente, lineas, subtotal, envio, total, pago, stripeSession }) => {
  const rutaPedidos = join(__dirname, 'data', 'orders.json');
  const pedidos = existsSync(rutaPedidos) ? loadJson('orders.json') : [];

  const pedido = {
    id: 'CU-' + Date.now().toString(36).toUpperCase(),
    fecha: new Date().toISOString(),
    pago,
    ...(stripeSession ? { stripeSession } : {}),
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

  // Los emails se envían en segundo plano: si fallan, el pedido ya
  // está guardado y el cliente no ve ningún error.
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

  return pedido;
};

// Crear un pedido contra reembolso.
app.post('/api/orders', (req, res) => {
  const { cliente = {}, items = [] } = req.body ?? {};
  const v = validarPedido(cliente, items);
  if (v.error) return res.status(400).json({ error: v.error });

  const pedido = guardarPedido({ cliente, ...v, pago: 'contrareembolso' });
  res.status(201).json({ id: pedido.id, total: pedido.total });
});

// Iniciar un pago con tarjeta: crea una sesión de Stripe Checkout y
// devuelve la URL de la página de pago segura de Stripe.
app.post('/api/checkout', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'El pago con tarjeta no está configurado todavía' });
  }
  const { cliente = {}, items = [] } = req.body ?? {};
  const v = validarPedido(cliente, items);
  if (v.error) return res.status(400).json({ error: v.error });

  const origen = req.headers.origin ?? process.env.CLIENT_URL ?? 'http://localhost:5173';

  const line_items = v.lineas.map((l) => ({
    price_data: {
      currency: 'eur',
      product_data: { name: l.nombre },
      unit_amount: Math.round(l.precio * 100),
    },
    quantity: l.qty,
  }));
  if (v.envio > 0) {
    line_items.push({
      price_data: {
        currency: 'eur',
        product_data: { name: 'Gastos de envío' },
        unit_amount: Math.round(v.envio * 100),
      },
      quantity: 1,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: String(cliente.email).trim(),
      // Los datos del pedido viajan en la sesión: al volver del pago
      // se recuperan verificados desde Stripe, no desde el navegador.
      metadata: {
        cliente: JSON.stringify(cliente).slice(0, 490),
        items: JSON.stringify(items.map(({ id, qty }) => [id, qty])).slice(0, 490),
      },
      success_url: `${origen}/pedido/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origen}/pedido`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creando la sesión de Stripe:', err.message);
    res.status(500).json({ error: 'No se pudo iniciar el pago con tarjeta' });
  }
});

// Confirmar un pago con tarjeta: verifica en Stripe que la sesión está
// pagada y entonces registra el pedido. Idempotente: si ya existe un
// pedido para esa sesión, lo devuelve sin duplicarlo.
app.post('/api/orders/confirm', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'El pago con tarjeta no está configurado todavía' });
  }
  const sessionId = String(req.body?.session_id ?? '');
  if (!sessionId) return res.status(400).json({ error: 'Falta session_id' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'El pago no está completado' });
    }

    const rutaPedidos = join(__dirname, 'data', 'orders.json');
    const pedidos = existsSync(rutaPedidos) ? loadJson('orders.json') : [];
    const existente = pedidos.find((p) => p.stripeSession === session.id);
    if (existente) {
      return res.json({ id: existente.id, total: existente.total });
    }

    const cliente = JSON.parse(session.metadata.cliente);
    const items = JSON.parse(session.metadata.items).map(([id, qty]) => ({ id, qty }));
    const v = validarPedido(cliente, items);
    if (v.error) return res.status(400).json({ error: v.error });

    const pedido = guardarPedido({ cliente, ...v, pago: 'tarjeta', stripeSession: session.id });
    res.status(201).json({ id: pedido.id, total: pedido.total });
  } catch (err) {
    console.error('Error confirmando el pago:', err.message);
    res.status(500).json({ error: 'No se pudo confirmar el pago' });
  }
});

app.listen(PORT, () => {
  console.log(`ChargeUp API escuchando en http://localhost:${PORT}`);
});

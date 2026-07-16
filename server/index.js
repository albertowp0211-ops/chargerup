import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';
import { readFileSync, existsSync, watch } from 'fs';
import { randomBytes, timingSafeEqual, createHash } from 'crypto';
import {
  enviarConfirmacion,
  enviarAvisoVenta,
  probarEmail,
  enviarAcuseDesistimiento,
} from './email.js';
import {
  usandoBd,
  inicializarBd,
  guardarPedidoBd,
  listarPedidos,
  buscarPorId,
  buscarPorStripeSession,
} from './db.js';
import { notificarVenta, notificarError } from './notify.js';
import { validarPedido } from './validar.js';
import { validarPromo } from './promos.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

// ¿Estamos en producción? Además de las señales explícitas (Render
// define RENDER; otros hostings usan NODE_ENV), se activa "fail-closed"
// ante la presencia de credenciales reales por variable de entorno: así
// ningún hosting distinto de Render puede arrancar por error con las
// protecciones desactivadas. En local la configuración llega por
// archivos (no por env), así que sigue tratándose como desarrollo.
const EN_PRODUCCION =
  Boolean(process.env.RENDER) ||
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.STRIPE_SECRET_KEY) ||
  Boolean(process.env.DATABASE_URL);

// Contraseña del panel de administración. Se lee de la variable de
// entorno ADMIN_PASSWORD o del archivo data/admin-password.txt (que
// está en .gitignore para que nunca se suba al repositorio).
const rutaPassword = join(__dirname, 'data', 'admin-password.txt');
const passwordConfigurada =
  process.env.ADMIN_PASSWORD ??
  (existsSync(rutaPassword) ? readFileSync(rutaPassword, 'utf-8').trim() : null);

// En producción una contraseña ausente o débil apaga el servidor.
if (EN_PRODUCCION && (!passwordConfigurada || passwordConfigurada.length < 12)) {
  console.error(
    'ADMIN_PASSWORD no está configurada (o tiene menos de 12 caracteres). ' +
      'Define la variable de entorno ADMIN_PASSWORD con una contraseña de al menos ' +
      '12 caracteres antes de arrancar en producción.'
  );
  process.exit(1);
}

// En desarrollo se respeta la contraseña configurada (aunque sea corta,
// solo se avisa). Únicamente si NO hay ninguna configurada se genera una
// aleatoria por arranque —nunca una constante conocida como la antigua
// 'chargeup123', que estaría publicada en el repo— y se muestra en
// consola para que el panel siga siendo usable.
let ADMIN_PASSWORD = passwordConfigurada;
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = randomBytes(12).toString('base64url');
  console.warn(
    `Aviso (solo desarrollo): sin ADMIN_PASSWORD. Contraseña temporal de ` +
      `esta sesión: ${ADMIN_PASSWORD}`
  );
} else if (ADMIN_PASSWORD.length < 12) {
  console.warn(
    'Aviso (solo desarrollo): la ADMIN_PASSWORD configurada tiene menos de ' +
      '12 caracteres. Úsala solo en local; en producción se exigen 12+.'
  );
}

// Claves de Stripe: variables de entorno o archivo local (gitignored).
// Sin la clave secreta, el pago con tarjeta queda desactivado.
const rutaStripe = join(__dirname, 'data', 'stripe-config.json');
const configStripe = existsSync(rutaStripe)
  ? JSON.parse(readFileSync(rutaStripe, 'utf-8'))
  : {};
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY ?? configStripe.secretKey ?? null;
const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET ?? configStripe.webhookSecret ?? null;
// timeout explícito: si Stripe tarda, la petición falla rápido en vez de
// dejar la promesa colgada indefinidamente.
const stripe = STRIPE_SECRET ? new Stripe(STRIPE_SECRET, { timeout: 10000 }) : null;

// Sesiones en memoria: token -> fecha de caducidad (8 horas).
// Se pierden al reiniciar el servidor; basta con volver a entrar.
const SESION_MS = 8 * 60 * 60 * 1000;
const sesiones = new Map();

const app = express();
app.set('trust proxy', 1);

// Cabeceras de seguridad HTTP (API sin páginas propias, la config por
// defecto de helmet basta).
app.use(helmet());

// Origen público de la tienda. En producción NUNCA puede quedar sin
// definir: sin él, CORS quedaría abierto y las URLs de vuelta de Stripe
// se derivarían del origen que mande el cliente (redirección abierta /
// phishing tras el pago). Si no se define en producción, se usa la URL
// desplegada conocida como red de seguridad (sin tumbar el servicio) y
// se avisa para que el dueño la configure explícitamente.
const CLIENT_URL_DEFECTO = 'https://chargerup-buse.vercel.app';
const CLIENT_URL =
  process.env.CLIENT_URL ?? (EN_PRODUCCION ? CLIENT_URL_DEFECTO : null);
if (EN_PRODUCCION && !process.env.CLIENT_URL) {
  console.warn(
    `Aviso: CLIENT_URL no está definida; usando ${CLIENT_URL_DEFECTO}. ` +
      'Configura CLIENT_URL con la URL pública real de la tienda.'
  );
}

// CORS: si hay origen conocido solo se aceptan la web desplegada y el
// entorno local de Vite; en desarrollo puro se mantiene abierto.
const ORIGENES_PERMITIDOS = CLIENT_URL ? [CLIENT_URL, 'http://localhost:5173'] : null;
if (ORIGENES_PERMITIDOS) {
  app.use(cors({ origin: ORIGENES_PERMITIDOS }));
} else {
  console.warn(
    'Aviso (desarrollo): CLIENT_URL no está definida, CORS queda abierto.'
  );
  app.use(cors());
}

// Webhook de Stripe: avisa directamente al servidor cuando un pago se
// completa, aunque el cliente cierre el navegador sin volver a la web.
// Se registra ANTES de express.json() porque la verificación de la
// firma necesita el cuerpo crudo de la petición.
app.post(
  '/api/stripe-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe || !STRIPE_WEBHOOK_SECRET) {
      return res.status(503).json({ error: 'Webhook no configurado' });
    }
    let evento;
    try {
      evento = stripe.webhooks.constructEvent(
        req.body,
        req.headers['stripe-signature'],
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook con firma no válida:', err.message);
      return res.status(400).json({ error: 'Firma no válida' });
    }

    try {
      const session = evento.data.object;
      if (evento.type === 'checkout.session.completed' && session.payment_status === 'paid') {
        const r = await crearPedidoDesdeSesion(session);
        console.log(
          r.creado
            ? `Pedido ${r.id} registrado por webhook (${session.id})`
            : `Webhook de ${session.id}: el pedido ${r.id} ya existía`
        );
      }
      res.json({ received: true });
    } catch (err) {
      console.error('Error procesando el webhook:', err.message);
      notificarError('Webhook de Stripe', err).catch(() => {});
      res.status(500).json({ error: 'Error interno' });
    }
  }
);

// Límite de tamaño del cuerpo: un pedido válido son unos pocos KB; más
// que eso es abuso. Evita ataques de payload gigante (JSON bomb).
app.use(express.json({ limit: '32kb' }));

// Backstop global de rate-limit para toda la API. Además de los
// limitadores específicos de login/checkout, ninguna IP puede superar un
// volumen razonable de peticiones: corta ráfagas abusivas contra los
// endpoints públicos sin limitador propio (/api/products, /api/health) y
// contra el acceso directo al origen de Render saltándose el edge. El
// límite es holgado para no molestar al tráfico legítimo (la tienda pide
// el catálogo una vez y lo cachea). El webhook de Stripe queda fuera a
// propósito: se registra antes de este middleware, así que un pico de
// pagos nunca lo bloquea. Debe declararse ANTES de las rutas para que las
// cubra a todas.
const limiteGlobal = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Prueba de nuevo más tarde' },
});
app.use('/api', limiteGlobal);

// El catálogo se cachea en memoria y se relee solo cuando el archivo
// cambia (fs.watch), en vez de leer y parsear el JSON en cada petición
// (que bloquearía el único hilo del event-loop bajo carga). Editar
// products.json sigue surtiendo efecto sin reiniciar el servidor.
const rutaProducts = join(__dirname, 'data', 'products.json');
let cacheProducts = null;
const cargarProducts = () => {
  if (cacheProducts === null) {
    cacheProducts = JSON.parse(readFileSync(rutaProducts, 'utf-8'));
  }
  return cacheProducts;
};
try {
  const vigilante = watch(rutaProducts, () => {
    cacheProducts = null; // se recargará en la próxima lectura
  });
  // Un error del watcher (p. ej. si el archivo se reemplaza) no debe
  // tumbar el proceso: se ignora y la próxima lectura releerá el disco.
  vigilante.on('error', () => {
    cacheProducts = null;
  });
} catch {
  // Si el sistema no soporta watch, cargarProducts relee bajo demanda.
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'chargeup-server' });
});

// Catálogo de productos. La cabecera de caché deja que el edge de
// Vercel sirva el catálogo aunque el servidor esté en cold start.
app.get('/api/products', (_req, res) => {
  res.set('Cache-Control', 's-maxage=300, stale-while-revalidate=86400');
  res.json(cargarProducts());
});

// Bloqueo de fuerza bruta del login: tras 5 intentos fallidos la IP
// queda bloqueada 15 minutos.
const INTENTOS_MAX = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const intentosPorIp = new Map();

// Límites de peticiones por IP (además del bloqueo de fuerza bruta).
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones de login. Prueba de nuevo más tarde' },
});
const limiteCheckout = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones de pago. Prueba de nuevo más tarde' },
});

// Barrido periódico de los mapas en memoria: sin él, las sesiones
// caducadas y los registros de IP se acumularían indefinidamente.
const limpiarMapas = () => {
  const ahora = Date.now();
  for (const [token, caducidad] of sesiones) {
    if (caducidad < ahora) sesiones.delete(token);
  }
  for (const [ip, registro] of intentosPorIp) {
    if (registro.bloqueadoHasta < ahora && registro.fallos === 0) {
      intentosPorIp.delete(ip);
    }
  }
};
setInterval(limpiarMapas, 30 * 60 * 1000).unref();

// Inicio de sesión del panel: si la contraseña es correcta devuelve
// un token que el cliente debe enviar en la cabecera Authorization.
app.post('/api/login', limiteLogin, (req, res) => {
  const ip = req.ip;
  const registro = intentosPorIp.get(ip) ?? { fallos: 0, bloqueadoHasta: 0 };
  if (registro.bloqueadoHasta > Date.now()) {
    const minutos = Math.ceil((registro.bloqueadoHasta - Date.now()) / 60000);
    return res
      .status(429)
      .json({ error: `Demasiados intentos fallidos. Prueba de nuevo en ${minutos} min` });
  }

  // Una contraseña vacía (o solo espacios) nunca autentica, venga de
  // donde venga la configurada. Se comparan los hash SHA-256 (longitud
  // fija) con timingSafeEqual para no filtrar por tiempo ni el resultado
  // ni la longitud de la contraseña real.
  const textoIntento = String(req.body?.password ?? '');
  const hashIntento = createHash('sha256').update(textoIntento).digest();
  const hashReal = createHash('sha256').update(ADMIN_PASSWORD).digest();
  const valida = textoIntento.trim().length > 0 && timingSafeEqual(hashIntento, hashReal);
  if (!valida) {
    registro.fallos += 1;
    if (registro.fallos >= INTENTOS_MAX) {
      registro.bloqueadoHasta = Date.now() + BLOQUEO_MS;
      registro.fallos = 0;
    }
    intentosPorIp.set(ip, registro);
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  intentosPorIp.delete(ip);
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

// Cierre de sesión: invalida el token en el servidor (no basta con
// borrarlo en el navegador, seguiría siendo válido hasta 8h).
app.post('/api/logout', requiereAdmin, (req, res) => {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /, '');
  sesiones.delete(token);
  res.json({ ok: true });
});

// Diagnóstico de la configuración de email (protegido): comprueba la
// conexión sin enviar ningún correo.
app.get('/api/email-test', requiereAdmin, async (req, res) => {
  res.json(await probarEmail(req.query.port));
});

// Listado de pedidos para el panel de administración (protegido).
app.get('/api/orders', requiereAdmin, async (_req, res) => {
  try {
    res.json(await listarPedidos());
  } catch (err) {
    console.error('Error listando pedidos:', err.message);
    res.status(500).json({ error: 'No se pudieron cargar los pedidos' });
  }
});

// Guarda el pedido (en PostgreSQL si hay BD, si no en orders.json)
// y lanza los emails en segundo plano.
const guardarPedido = async ({ cliente, lineas, subtotal, envio, total, descuento, promo, pago, stripeSession }) => {
  const pedido = {
    // Sufijo aleatorio además del timestamp: evita ids idénticos para
    // dos pedidos creados en el mismo milisegundo (colisión de PK).
    id:
      'CU-' +
      Date.now().toString(36).toUpperCase() +
      '-' +
      randomBytes(2).toString('hex').toUpperCase(),
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
    ...(descuento > 0 ? { descuento } : {}),
    ...(promo ? { promo } : {}),
    total,
  };

  // guardarPedidoBd devuelve false si esta sesión de Stripe ya estaba
  // registrada (carrera webhook/página de éxito): en ese caso el pedido
  // ya existe y NO se vuelven a disparar emails ni notificaciones.
  const insertado = await guardarPedidoBd(pedido);
  if (!insertado) {
    const existente = (await buscarPorStripeSession(pedido.stripeSession)) ?? pedido;
    return { ...existente, creado: false };
  }

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

  // Notificación instantánea al móvil (Telegram), independiente del email.
  notificarVenta(pedido)
    .then((r) =>
      console.log(
        r.enviado
          ? `Notificación push enviada (${pedido.id})`
          : `Sin notificación push de ${pedido.id}: ${r.motivo}`
      )
    )
    .catch((err) =>
      console.error(`No se pudo enviar la notificación push de ${pedido.id}:`, err.message)
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

  return { ...pedido, creado: true };
};

// Crea (o recupera, si ya existía) el pedido de una sesión de Stripe
// pagada. Lo usan el webhook y la página de éxito: llegue quien llegue
// primero, el pedido se registra una sola vez.
const crearPedidoDesdeSesion = async (session) => {
  const existente = await buscarPorStripeSession(session.id);
  if (existente) {
    return { creado: false, id: existente.id, total: existente.total };
  }

  const cliente = JSON.parse(session.metadata.cliente);
  const items = JSON.parse(session.metadata.items).map(([id, qty]) => ({ id, qty }));
  const v = validarPedido(cliente, items, cargarProducts());
  if (v.error) throw new Error(v.error);

  // Un pedido pagado NUNCA se descarta: el cliente ya pagó. Se compara
  // lo que Stripe cobró con lo recalculado solo para vigilar anomalías:
  // un importe MENOR es normal si se usó un código promocional (se anota
  // como descuento); un importe distinto por arriba, o en otra moneda,
  // es raro (p. ej. se editó un precio a mitad de compra) y se avisa para
  // revisión manual, pero el pedido se registra igual con lo cobrado.
  const esperadoCents = Math.round(v.total * 100);
  const cobradoCents = session.amount_total ?? esperadoCents;
  const totalCobrado = +(cobradoCents / 100).toFixed(2);
  const descuento = +((esperadoCents - cobradoCents) / 100).toFixed(2);
  if (session.currency !== 'eur' || cobradoCents > esperadoCents) {
    notificarError(
      'Importe de Stripe no cuadra',
      new Error(
        `sesión ${session.id}: cobrado ${cobradoCents} ${session.currency}, ` +
          `esperado ${esperadoCents} eur`
      )
    ).catch(() => {});
  }

  const pedido = await guardarPedido({
    cliente,
    ...v,
    total: totalCobrado,
    ...(descuento > 0 ? { descuento } : {}),
    ...(session.metadata.promo ? { promo: session.metadata.promo } : {}),
    pago: 'tarjeta',
    stripeSession: session.id,
  });
  return { creado: pedido.creado, id: pedido.id, total: pedido.total };
};

// Validación de un código promocional desde el carrito. Comparte el
// rate-limit del checkout para que nadie pueda adivinar códigos por
// fuerza bruta, y la respuesta de fallo es genérica (no distingue entre
// "no existe" y "desactivado").
app.post('/api/promo', limiteCheckout, (req, res) => {
  const promo = validarPromo(req.body?.codigo);
  if (!promo) {
    return res.status(404).json({ error: 'Este código no es válido' });
  }
  res.json(promo);
});

// Iniciar un pago con tarjeta: crea una sesión de Stripe Checkout y
// devuelve la URL de la página de pago segura de Stripe.
app.post('/api/checkout', limiteCheckout, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'El pago con tarjeta no está configurado todavía' });
  }
  const { cliente = {}, items = [] } = req.body ?? {};
  const v = validarPedido(cliente, items, cargarProducts());
  if (v.error) return res.status(400).json({ error: v.error });

  // Código promocional: SIEMPRE se revalida en el servidor (el pct que
  // calculó el carrito no se acepta jamás del cliente). Si el código dejó
  // de ser válido entre el carrito y el pago, se avisa en vez de cobrar
  // un precio distinto del que el cliente vio en pantalla.
  let promo = null;
  if (req.body?.promo) {
    promo = validarPromo(req.body.promo);
    if (!promo) {
      return res.status(400).json({
        error: 'El código promocional ya no es válido. Quítalo del carrito e inténtalo de nuevo',
      });
    }
  }
  // El descuento se aplica solo a los productos (no al envío), redondeado
  // al céntimo. Con él, Stripe cobra exactamente el total que vio el
  // cliente; el webhook lo registrará como "descuento" al comparar con el
  // precio de catálogo.
  const descuentoCents = promo ? Math.round(v.subtotal * promo.pct) : 0;

  // Origen de las URLs de vuelta: si hay allowlist, solo se acepta un
  // origin que esté en ella (evita que un atacante genere un Checkout
  // real de la tienda que redirija a su propia página).
  const origen = ORIGENES_PERMITIDOS
    ? ORIGENES_PERMITIDOS.includes(req.headers.origin)
      ? req.headers.origin
      : CLIENT_URL
    : req.headers.origin ?? 'http://localhost:5173';

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

  // Los datos del pedido viajan en la sesión: al volver del pago se
  // recuperan verificados desde Stripe, no desde el navegador. Stripe
  // limita cada valor de metadata a 500 caracteres; con los límites de
  // longitud de validarPedido nunca debería alcanzarse, pero truncar
  // rompería el JSON, así que se rechaza el pedido entero.
  const metaCliente = JSON.stringify(cliente);
  const metaItems = JSON.stringify(items.map(({ id, qty }) => [id, qty]));
  if (metaCliente.length > 490 || metaItems.length > 490) {
    return res.status(400).json({ error: 'Los datos del pedido son demasiado largos' });
  }

  try {
    // Con código propio se pasa como cupón de importe fijo (calculado
    // sobre los productos, sin el envío) y aparece con su nombre en la
    // página de pago. Stripe no permite combinar `discounts` con
    // `allow_promotion_codes`, así que el campo de Stripe solo se ofrece
    // cuando no hay código de la tienda aplicado.
    const descuento = descuentoCents > 0
      ? {
          discounts: [
            {
              coupon: (
                await stripe.coupons.create({
                  amount_off: descuentoCents,
                  currency: 'eur',
                  duration: 'once',
                  name: `Código ${promo.codigo}`,
                })
              ).id,
            },
          ],
        }
      : { allow_promotion_codes: true };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      customer_email: String(cliente.email).trim(),
      ...descuento,
      metadata: {
        cliente: metaCliente,
        items: metaItems,
        ...(promo ? { promo: promo.codigo } : {}),
      },
      success_url: `${origen}/pedido/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origen}/pedido`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Error creando la sesión de Stripe:', err.message);
    notificarError('Checkout de Stripe', err).catch(() => {});
    res.status(500).json({ error: 'No se pudo iniciar el pago con tarjeta' });
  }
});

// Confirmar un pago con tarjeta: verifica en Stripe que la sesión está
// pagada y entonces registra el pedido. Idempotente: si ya existe un
// pedido para esa sesión, lo devuelve sin duplicarlo.
app.post('/api/orders/confirm', limiteCheckout, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'El pago con tarjeta no está configurado todavía' });
  }
  // Se valida el formato del session_id (siempre empieza por 'cs_')
  // antes de llamar a Stripe, para no convertir el endpoint en un
  // amplificador de peticiones con ids arbitrarios.
  const sessionId = String(req.body?.session_id ?? '');
  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    return res.status(400).json({ error: 'Falta un identificador de pago válido' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'El pago no está completado' });
    }

    const r = await crearPedidoDesdeSesion(session);
    res.status(r.creado ? 201 : 200).json({ id: r.id, total: r.total });
  } catch (err) {
    console.error('Error confirmando el pago:', err.message);
    notificarError('Confirmación de pedido', err).catch(() => {});
    res.status(500).json({ error: 'No se pudo confirmar el pago' });
  }
});

// Desistimiento en línea (Directiva UE 2023/2673): el cliente indica su
// número de pedido y su email; si coinciden con un pedido real, se registra
// la solicitud y se le envía un acuse de recibo con fecha y hora (soporte
// duradero). Requerir la coincidencia evita enviar acuses a terceros.
app.post('/api/desistimiento', limiteCheckout, async (req, res) => {
  const pedidoId = String(req.body?.pedido ?? '').trim().toUpperCase().slice(0, 40);
  const email = String(req.body?.email ?? '').trim().slice(0, 120);
  const motivo = String(req.body?.motivo ?? '').trim().slice(0, 1000);
  if (!/^CU-[A-Z0-9-]+$/.test(pedidoId) || !/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email)) {
    return res.status(400).json({ error: 'Indica un número de pedido y un email válidos.' });
  }
  try {
    const pedido = await buscarPorId(pedidoId);
    if (!pedido || String(pedido.cliente?.email ?? '').toLowerCase() !== email.toLowerCase()) {
      return res.status(404).json({
        error:
          'No encontramos un pedido con ese número y email. Revisa los datos o escríbenos por correo.',
      });
    }
    const { fecha } = await enviarAcuseDesistimiento({ pedidoId, email, motivo });
    res.json({ ok: true, fecha });
  } catch (err) {
    console.error('Error registrando el desistimiento:', err.message);
    notificarError('Desistimiento', err).catch(() => {});
    res.status(500).json({ error: 'No se pudo registrar la solicitud. Escríbenos por correo.' });
  }
});

// Manejador de errores final: registra el fallo y responde con un
// mensaje genérico, sin filtrar nunca la traza al cliente. Los cuatro
// parámetros son obligatorios para que Express lo trate como manejador
// de errores.
app.use((err, _req, res, _next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Promesas rechazadas sin capturar: se registran y se avisa por
// Telegram para no perderlas en los logs efímeros del hosting.
process.on('unhandledRejection', (motivo) => {
  const err = motivo instanceof Error ? motivo : new Error(String(motivo));
  console.error('Promesa rechazada sin capturar:', err.message);
  notificarError('unhandledRejection', err).catch(() => {});
});

// En producción los pedidos pagados no pueden acabar en orders.json
// sobre un filesystem efímero: sin DATABASE_URL el servidor no arranca
// (salvo que se fuerce explícitamente con ALLOW_JSON_ORDERS=1).
if (EN_PRODUCCION && !process.env.DATABASE_URL && process.env.ALLOW_JSON_ORDERS !== '1') {
  console.error(
    'DATABASE_URL no está configurada: en producción los pedidos se perderían ' +
      'al reiniciar el servidor. Define DATABASE_URL (PostgreSQL) o, solo si ' +
      'sabes lo que haces, ALLOW_JSON_ORDERS=1 para usar orders.json.'
  );
  process.exit(1);
}

inicializarBd()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`ChargeUp API escuchando en http://localhost:${PORT}`);
      console.log(
        usandoBd
          ? 'Pedidos guardados en PostgreSQL'
          : 'Pedidos guardados en orders.json (sin base de datos configurada)'
      );
    });
  })
  .catch((err) => {
    console.error('No se pudo inicializar la base de datos:', err.message);
    process.exit(1);
  });

# ChargeUp ⚡

Tienda online de cargadores y accesorios de carga. Frontend en React (Vite) y backend en Node.js (Express).

## Estructura

```
chargeup/
├── client/    → Web en React + Vite (puerto 5173)
└── server/    → API en Node.js + Express (puerto 3001)
    └── data/  → Productos, oferta y pedidos en JSON
```

## Puesta en marcha

```bash
npm run install-all   # instala dependencias de raíz, servidor y cliente
npm run dev           # arranca servidor y cliente a la vez
```

- Tienda: http://localhost:5173
- Panel de pedidos: http://localhost:5173/admin

## Configuración (archivos NO incluidos en el repositorio)

Estos archivos se crean en `server/data/` y están en `.gitignore`:

- `admin-password.txt` — contraseña del panel de administración (una línea).
  Si no existe, la contraseña por defecto es `chargeup123`. También se puede
  definir con la variable de entorno `ADMIN_PASSWORD`.
- `email-config.json` — credenciales SMTP para enviar emails de confirmación:

```json
{
  "activo": true,
  "host": "smtp.gmail.com",
  "port": 465,
  "user": "tu-correo@gmail.com",
  "pass": "contraseña-de-aplicacion",
  "from": "ChargeUp <tu-correo@gmail.com>"
}
```

Con `"activo": false` (o sin el archivo), los emails se guardan como HTML
en `server/data/emails/` en lugar de enviarse.

El campo `"avisos"` es el correo del dueño: recibe un email con cada venta.

En producción (Render) la configuración de email se define con variables
de entorno en lugar del archivo: `BREVO_API_KEY` + `EMAIL_USER` (vía API
de Brevo, recomendada), o `EMAIL_USER` + `EMAIL_PASS` (SMTP), y
opcionalmente `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_FROM` y `EMAIL_AVISOS`.

Todas las variables están documentadas en `server/.env.example`.

Otras variables de entorno del servidor:

- `STRIPE_SECRET_KEY` — clave secreta de Stripe (pago con tarjeta).
- `STRIPE_WEBHOOK_SECRET` — firma del webhook `checkout.session.completed`
  apuntando a `/api/stripe-webhook`; registra el pedido aunque el cliente
  no vuelva a la web tras pagar.
- `DATABASE_URL` — PostgreSQL para los pedidos (sin ella, orders.json).
- `CLIENT_URL` — URL pública de la tienda. Si se define, CORS y las URLs
  de vuelta de Stripe se restringen a ese origen (más el localhost de
  Vite). Sin ella, CORS queda abierto con un aviso al arrancar.
- `ALLOW_JSON_ORDERS` — pon `1` para permitir guardar pedidos en
  `orders.json` en producción (no recomendado; ver más abajo).
- `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` — bot de Telegram para
  avisos de venta y de error en el móvil.

### Protecciones de seguridad

- **Contraseña de admin obligatoria en producción**: si `ADMIN_PASSWORD`
  falta o tiene menos de 12 caracteres, el servidor no arranca (en
  desarrollo solo avisa y usa una contraseña temporal). Una contraseña
  vacía nunca autentica.
- **Base de datos obligatoria en producción**: sin `DATABASE_URL` el
  servidor no arranca (los pedidos se perderían al reiniciar Render),
  salvo que se fuerce con `ALLOW_JSON_ORDERS=1`.
- **Cabeceras HTTP** con `helmet`, y **límite de peticiones** por IP:
  10 logins y 30 pagos cada 15 minutos, además del bloqueo de fuerza
  bruta (la IP se bloquea 15 min tras 5 intentos fallidos de login).
- Los precios se recalculan siempre en el servidor a partir del
  catálogo; el cliente nunca envía importes. Los datos del cliente se
  escapan antes de meterlos en emails o en Telegram.

## Tests

```bash
npm test            # tests unitarios del servidor (node:test)
npm run test:e2e    # compra de prueba real contra la tienda (Stripe test)
```

`npm run test:e2e` necesita `npx playwright install chromium` la primera
vez y la variable `TIENDA_URL` si no apuntas a la web por defecto.

## Editar el catálogo

- Productos y precios: `server/data/products.json`

Los cambios se aplican sin reiniciar el servidor.

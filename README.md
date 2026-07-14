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

Otras variables de entorno del servidor:

- `STRIPE_SECRET_KEY` — clave secreta de Stripe (pago con tarjeta).
- `STRIPE_WEBHOOK_SECRET` — firma del webhook `checkout.session.completed`
  apuntando a `/api/stripe-webhook`; registra el pedido aunque el cliente
  no vuelva a la web tras pagar.
- `DATABASE_URL` — PostgreSQL para los pedidos (sin ella, orders.json).
- `NTFY_TOPIC` — canal de ntfy.sh para avisos de venta en el móvil.

El login del panel bloquea la IP durante 15 minutos tras 5 intentos
fallidos.

## Editar el catálogo

- Productos y precios: `server/data/products.json`

Los cambios se aplican sin reiniciar el servidor.

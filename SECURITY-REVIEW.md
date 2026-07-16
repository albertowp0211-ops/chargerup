# Revisión de seguridad — ChargeUp

## Resumen

Tras el reciente endurecimiento (helmet, rate-limit, allowlist CORS, escape de HTML, `validar.js`, guards de producción, índice único anti-duplicados) la postura general es sólida: no quedan vulnerabilidades críticas ni de ejecución remota, la superficie de inyección (SQL y HTML/XSS) está correctamente cubierta y el bundle del cliente no filtra secretos. Lo más importante que falta es cerrar las vías de **mala configuración**: el guard de producción no cubre `CLIENT_URL` (habilita CORS abierto y redirección abierta post-pago) y solo se activa en Render, dejando alcanzable la contraseña por defecto `chargeup123` en cualquier otro host. Corregir esos dos guards y verificar el TLS de Postgres elimina el grueso del riesgo real.

## Hallazgos por severidad

### [MEDIUM] Falta guard de producción para `CLIENT_URL` → CORS abierto y redirección abierta post-pago
**Archivo:** `server/index.js:81-90, 335-339, 381-382`
**Riesgo:** El endurecimiento añadió `process.exit(1)` para `ADMIN_PASSWORD` y `DATABASE_URL`, pero no para `CLIENT_URL`. Si queda sin definir (variable opcional fácil de olvidar en Render), `ORIGENES_PERMITIDOS` es `null`, por lo que (a) se aplica `cors()` sin allowlist, reflejando cualquier origen, y (b) en `/api/checkout` el origen de retorno cae a `req.headers.origin ?? 'http://localhost:5173'`, controlado por el atacante. Un POST con `Origin: https://evil.com` y un carrito válido devuelve una URL de Stripe Checkout legítima y de marca ChargeUp cuyo `success_url`/`cancel_url` apunta a evil.com. Tras pagar en la página real de Stripe, la víctima es redirigida a una página de phishing, y se filtra el `session_id`. CORS no mitiga: el header `Origin` se falsifica trivialmente desde cualquier cliente no-navegador.
**Corrección:** Añadir el guard espejo: `if (EN_PRODUCCION && !CLIENT_URL) { console.error(...); process.exit(1); }`. Nunca derivar `success_url`/`cancel_url` de `req.headers.origin`; usar siempre `CLIENT_URL` del servidor y solo aceptar el origen de la petición si está explícitamente en la allowlist.

### [MEDIUM] Los guards de producción se saltan en cualquier host que no sea Render → contraseña `chargeup123` alcanzable
**Archivo:** `server/index.js:26, 40, 54, 437`
**Riesgo:** `EN_PRODUCCION = Boolean(process.env.RENDER) || NODE_ENV==='production'`. Todo guard de seguridad cuelga de esta bandera. En cualquier host donde no exista `RENDER` ni se ponga `NODE_ENV=production` (Railway, Fly.io, VPS, Docker por defecto), la bandera es `false`: el servidor solo advierte y continúa hasta `ADMIN_PASSWORD ?? 'chargeup123'` y hasta `orders.json` en filesystem efímero. `chargeup123` está publicado en el README del repo público. Un atacante hace `POST {password:'chargeup123'}` a `/api/login`, obtiene un token de 8h y lee todo el PII de clientes vía `GET /api/orders`. Además, los pedidos pagados desaparecen en cada reinicio.
**Corrección:** Hacer los guards *fail-closed*: tratar la app como producción salvo opt-out dev explícito, o activar `EN_PRODUCCION` ante la presencia de cualquier credencial real (`STRIPE_SECRET_KEY`, `DATABASE_URL`). Eliminar el literal `'chargeup123'` alcanzable y dejar de documentar una contraseña por defecto en el README.

### [MEDIUM] El webhook/confirm nunca verifica `amount_total` de Stripe contra el total recalculado
**Archivo:** `server/index.js:307-320`
**Riesgo:** `crearPedidoDesdeSesion` recalcula `lineas/subtotal/envio/total` con `validarPedido` y registra ese total, pero nunca lo compara con `session.amount_total` (lo que Stripe realmente cobró); `amount_total` no se referencia en ningún sitio. Con `allow_promotion_codes: true` (línea 376) activo, un cliente puede aplicar un código promocional y pagar 10 EUR mientras el pedido se guarda diciendo 45 EUR. Cualquier divergencia entre lo cobrado y lo recalculado pasa desapercibida, anulando el sentido del chequeo de sesión pagada.
**Corrección:** Tras recalcular `v.total`, aseverar `Math.round(v.total*100) === session.amount_total` y `session.currency === 'eur'`; si difieren, no crear el pedido automáticamente y lanzar `notificarError` para revisión manual.

### [MEDIUM] Verificación de certificado TLS de PostgreSQL desactivada (`rejectUnauthorized:false`) — MITM sobre la base de pedidos
**Archivo:** `server/db.js:21`
**Riesgo:** El Pool de `pg` se crea con `ssl:{ rejectUnauthorized: false }` para todo `DATABASE_URL` que no sea localhost. Esto cifra pero no autentica: el cliente acepta cualquier certificado. Un atacante con posición de red (DNS/ARP/BGP spoofing, intermediario comprometido entre Render y el Postgres gestionado) presenta un certificado autofirmado, hace de proxy y lee/modifica todo el PII de pedidos en tránsito, o cosecha las credenciales de la BD, sin que se levante ningún error.
**Corrección:** Verificar el certificado del servidor: `ssl:{ ca: readFileSync(caPath), rejectUnauthorized: true }` con el bundle CA del proveedor, o `sslmode=verify-full` en la cadena de conexión. Reservar `rejectUnauthorized:false` solo para localhost/dev, que ya se trata por separado.

### [MEDIUM] Sin cabeceras de seguridad en el front-end servido por Vercel — panel `/admin` clickjackable y sin CSP
**Archivo:** `client/vercel.json:1-6`
**Riesgo:** `vercel.json` solo contiene `rewrites`, sin bloque `headers`, e `index.html` no define CSP ni meta de frames. `helmet()` corre en la API Express, pero la API solo devuelve JSON — nunca sirve el HTML/JS que el navegador ejecuta. Así, toda la SPA, incluida la ruta `/admin` y su formulario de login, se entrega sin CSP, sin `X-Frame-Options`/`frame-ancestors` y sin HSTS. El panel puede incrustarse en un iframe oculto para clickjacking, cualquier inyección de script exfiltra el `chargeup-admin-token` de sessionStorage sin CSP que lo module, y la ausencia de HSTS permite SSL-strip.
**Corrección:** Añadir un bloque `headers` en `vercel.json` para todas las rutas: `Content-Security-Policy` (default-src 'self'; restringir connect/script/frame-ancestors), `X-Frame-Options: DENY` (o `frame-ancestors 'none'`), `Strict-Transport-Security` y `Referrer-Policy: strict-origin-when-cross-origin`.

### [MEDIUM] `/api/orders/confirm` sin autenticación ni rate-limit — DoS/amplificación de coste y oráculo de session_id
**Archivo:** `server/index.js:395-415`
**Riesgo:** A diferencia de `/api/login` (`limiteLogin`) y `/api/checkout` (`limiteCheckout`), este endpoint no tiene auth ni limitador. Cada llamada ejecuta `stripe.checkout.sessions.retrieve(sessionId)` con input controlado por el atacante y, en la ruta pagada, un `readFileSync` síncrono de `products.json`. Es alcanzable directamente en `chargerup-api.onrender.com`, saltándose el edge de Vercel. Un atacante inunda el endpoint con `session_id` arbitrarios: agota la cuota de la API de Stripe (degradando checkouts reales), dispara spam de `notificarError` a Telegram y usa los códigos de estado distintos (400/402/200/500) como oráculo de validez de sesiones.
**Corrección:** Aplicar un rate-limiter (reutilizar `limiteCheckout` o uno dedicado). Validar el prefijo `cs_` del `session_id` antes de llamar a Stripe y colapsar todas las respuestas de no-éxito a una forma genérica para eliminar el oráculo.

### [MEDIUM] Carrera webhook-vs-confirm envía emails y notificaciones duplicados pese al índice único
**Archivo:** `server/index.js:307-320, 240-302; server/db.js:50-70`
**Riesgo:** El índice único / `ON CONFLICT DO NOTHING` deduplica solo la FILA de la BD, no los efectos secundarios. `crearPedidoDesdeSesion` comprueba `buscarPorStripeSession` (no atómico) y luego `guardarPedido` dispara incondicionalmente `enviarConfirmacion`, `notificarVenta` (Telegram) y `enviarAvisoVenta`. `guardarPedidoBd` devuelve `void` y no indica si el INSERT realmente insertó. El webhook y la página de éxito (`/api/orders/confirm`) se disparan casi a la vez; si ambos pasan el chequeo, el cliente recibe dos correos de confirmación y el dueño dos alertas de Telegram y dos correos de venta por un único pedido.
**Corrección:** Hacer que `guardarPedidoBd` reporte si insertó de verdad (`INSERT ... RETURNING` / `rowCount`, y booleano en el path JSON) y disparar los efectos secundarios solo cuando se creó una fila nueva.

### [MEDIUM] El logout nunca invalida la sesión en el servidor — los tokens siguen válidos 8h tras "Cerrar sesión"
**Archivo:** `server/index.js:70, 206-220; client/src/pages/AdminPage.jsx:28-33`
**Riesgo:** Las sesiones son un `Map` en memoria `token->expiry`. `requiereAdmin` solo comprueba presencia y expiración; el único `sesiones.delete` se dispara cuando el token ya está ausente/expirado. No existe ruta `/api/logout`. `cerrarSesion()` en el cliente solo hace `sessionStorage.removeItem` + `setToken(null)` — un gesto puramente local. Un admin en una máquina compartida pulsa "Cerrar sesión" creyendo terminar la sesión, pero el bearer token (ya observado por un atacante vía proxy, shoulder-surf de devtools o extensión maliciosa) sigue siendo válido hasta 8h, permitiendo replay contra `GET /api/orders` y lectura de todo el PII. No hay revocación salvo reiniciar el proceso; el re-login deja vivos los tokens previos y el Map crece sin GC.
**Corrección:** Añadir `POST /api/logout` protegido por `requiereAdmin` que haga `sesiones.delete(token)`, y llamarlo desde `cerrarSesion()`. Considerar TTL corto + refresh o mecanismo de revocación para matar un token comprometido sin reiniciar. Barrer periódicamente tokens expirados.

### [MEDIUM] Token de admin en `sessionStorage` — robable por XSS, no httpOnly, no revocable, vida de 8h
**Archivo:** `client/src/pages/AdminPage.jsx:19, 74`
**Riesgo:** El token vive en `sessionStorage` y viaja como header `Authorization`. Cualquier JS del origen (una futura XSS, una dependencia npm comprometida, una extensión maliciosa) puede leer `sessionStorage.getItem('chargeup-admin-token')` y exfiltrarlo. Como el servidor no puede revocarlo (ver hallazgo de logout) y vive 8h sin rotación ni idle-timeout, un solo robo da acceso de lectura prolongado a todos los pedidos. Hoy React auto-escapa los campos del cliente, así que no es directamente inyectable, pero el almacenamiento no aporta defensa en profundidad.
**Corrección:** Preferir una cookie `httpOnly, Secure, SameSite=Strict` puesta por el servidor (inaccesible desde JS y que además habilita el logout server-side). Si no es viable, mantener TTL absoluto corto con re-auth silenciosa y añadir revocación server-side.

### [MEDIUM] `/api/products` público hace `readFileSync` + `JSON.parse` síncronos por petición sin rate-limit — DoS por bloqueo del event-loop
**Archivo:** `server/index.js:138-150`
**Riesgo:** `loadJson` usa `readFileSync` (bloqueante) y se invoca por petición. `/api/products` es público y sin limitador. Cada hit lee y parsea `products.json` en el único hilo del event-loop; una ráfaga serializa todo el tráfico (checkout, webhook, login) detrás de I/O de disco. El `Cache-Control` solo ayuda al edge de Vercel: peticiones con cache-busting o directas al origen de Render pagan el coste completo. `loadJson` también está en el hot-path de `/api/checkout`, `/api/orders/confirm` y el webhook.
**Corrección:** Leer `products.json` una vez en memoria al arrancar (o cachear con `fs.watch`/TTL corto) en lugar de `readFileSync` por petición; usar `fs.promises.readFile` si hay recarga, y poner rate-limit en los endpoints públicos de lectura.

### [LOW] Bloqueo anti-fuerza-bruta y sesiones solo en memoria — se borran en cada reinicio/redeploy de Render
**Archivo:** `server/index.js:70, 156, 178-207`
**Riesgo:** `intentosPorIp` y `sesiones` son `Map` en proceso. Render reinicia y redespliega con frecuencia; cada reinicio limpia `intentosPorIp`, reseteando el bloqueo de 5-fallos/15-min a cero. `limiteLogin` (10/15min por IP) también es en memoria y por instancia. El bloqueo es un frenado suave, no un control duradero: un atacante hace 5 intentos, espera el bloqueo o el churn natural de la instancia, y reanuda desde cero.
**Corrección:** Respaldar el contador de fallos y el rate-limit con un almacén compartido (el Postgres existente o Redis) por IP, o aplicar backoff exponencial/global. Asegurar alta entropía en `ADMIN_PASSWORD` (el mínimo de 12 caracteres no garantiza fortaleza).

### [LOW] Los `Map` `sesiones` e `intentosPorIp` crecen sin límite — sin barrido de expiración
**Archivo:** `server/index.js:70, 156`
**Riesgo:** `sesiones` solo borra al mirar ese token exacto; tokens de admins que no vuelven nunca se purgan. `intentosPorIp` solo se borra en login exitoso, así que cada IP distinta que golpee `/api/login` deja una entrada permanente. Sin `setInterval` de limpieza, en una instancia de larga vida es una fuga de memoria lenta y monótona hasta un reinicio por OOM.
**Corrección:** Añadir un barrido periódico (`setInterval`) que borre entradas con `expiry`/`bloqueadoHasta` en el pasado, o usar una caché TTL (p.ej. `lru-cache`) para ambos mapas.

### [LOW] `trust proxy=1` es correcto solo para el salto único actual; un CDN por delante rompe silenciosamente el keying por IP
**Archivo:** `server/index.js:73, 177, 134`
**Riesgo:** `app.set('trust proxy', 1)` hace `req.ip` inspoofable hoy para la ruta directa Vercel→Render. Pero depende de que haya exactamente un salto de proxy. Si se añade un CDN/WAF (Cloudflare) delante sin revisarlo, `req.ip` colapsa a la IP del edge para todas las peticiones: 5 logins fallidos de un atacante bloquearían (y rate-limitarían) a todos los admins — un DoS global. Un under-count haría `X-Forwarded-For` falsificable por el cliente, saltándose rate-limits y bloqueo. Además, `express.json()` (línea 134) no fija `limit` explícito y depende del 100kb implícito de body-parser.
**Corrección:** Documentar y fijar la topología de proxies; ajustar `trust proxy` al número exacto de saltos (o un predicado de IP de proxy) y re-verificar `req.ip` ante cualquier cambio de infraestructura. Fijar `express.json({ limit: '16kb' })`.

### [LOW] El pre-chequeo de longitud en login filtra la longitud de la contraseña por canal lateral
**Archivo:** `server/index.js:189-194`
**Riesgo:** La comparación es `intento.length === real.length && timingSafeEqual(...)`. La igualdad de longitud se evalúa y cortocircuita antes del compare de tiempo constante, así que intentos de longitud distinta a la real toman un camino medible diferente. Un atacante que mida timing aprende la longitud exacta de `ADMIN_PASSWORD` y reduce el espacio de búsqueda.
**Corrección:** Comparar contra un digest de longitud fija: hashear (SHA-256) tanto el intento como la contraseña almacenada y hacer `timingSafeEqual` sobre los digests, para no revelar nunca la longitud. Mejor aún, almacenar/verificar con un KDF lento (bcrypt/argon2).

### [LOW] El regex de email permite comas → múltiples destinatarios en la ruta SMTP de nodemailer
**Archivo:** `server/validar.js:17`
**Riesgo:** `REGEX_EMAIL = /^\S+@\S+\.\S+$/` excluye espacios en blanco (bloquea correctamente la inyección de cabeceras CRLF), pero `\S` acepta comas, así que `victim@x.com,attacker@evil.com` pasa. En `email.js` esta cadena va a `nodemailer.sendMail({to})`, que trata el valor separado por comas como múltiples destinatarios, entregando el correo de confirmación a todas las direcciones. Un atacante que complete un pedido real y pagado puede relayar el correo de marca a un tercero. (Brevo y Stripe validan formato y rechazan la coma; solo afecta al fallback SMTP clásico.)
**Corrección:** Endurecer el regex a una sola dirección sin comas ni múltiples `@`, p.ej. `/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/`, y/o rechazar si contiene `,` antes de `sendMail`.

### [LOW] `/api/email-test` filtra configuración SMTP/de cuenta y cuerpos de error crudos del proveedor
**Archivo:** `server/email.js:150-166`
**Riesgo:** `probarEmail` devuelve config interna al cliente: en fallo `{ motivo: e.message, usuario, host, puerto }` y en éxito el email de cuenta Brevo, remitente y destinatario de avisos. `e.message` puede ser el cuerpo crudo de respuesta de Brevo/SMTP. Aunque está tras `requiereAdmin`, un atacante con token (vía la contraseña débil o un token robado) enumera la infraestructura de correo — host, puerto, direcciones, identidad de la cuenta Brevo — útil para phishing dirigido.
**Corrección:** Devolver al cliente solo un booleano `ok` y un motivo genérico no sensible; loguear `usuario/host/puerto` y cuerpos del proveedor solo en servidor. Nunca reflejar `await res.text()` de una API upstream en la respuesta.

### [LOW] El id de pedido derivado de `Date.now()` colisiona para pedidos creados en el mismo milisegundo
**Archivo:** `server/index.js:242; server/db.js:54-59`
**Riesgo:** El id es `'CU-' + Date.now().toString(36).toUpperCase()`, sin aleatoriedad por pedido. Dos pedidos distintos en el mismo milisegundo obtienen ids idénticos. En la BD el `ON CONFLICT` infiere solo el índice parcial de `stripeSession`, no la PK `id`, así que un id colisionado lanza `unique_violation` no manejado (el webhook devuelve 500 y Stripe reintenta, o el confirm del comprador devuelve 500 y su pedido pagado no se registra). En modo JSON ambos registros comparten id y se confunden en listados/lookups.
**Corrección:** Añadir aleatoriedad al id (`randomBytes(4).toString('hex')`) o usar un UUID, para hacerlos resistentes a colisiones independientemente de la resolución del timestamp.

### [LOW] Los `fetch` salientes a Telegram y Brevo no tienen timeout — upstreams colgados fugan sockets/promesas indefinidamente
**Archivo:** `server/notify.js:48-56; server/email.js:108, 145`
**Riesgo:** `enviarTelegram` y `enviarCorreo`/`probarEmail` usan `fetch` nativo sin `AbortController`/timeout. `fetch` nativo no tiene timeout por defecto, así que si `api.telegram.org` o `api.brevo.com` se cuelga, la promesa y su socket quedan pendientes hasta el timeout TCP del SO (minutos). Al dispararse en background no bloquean el event-loop, pero bajo un upstream estancado acumulan sockets abiertos y promesas sin resolver sin cota, creciendo la huella de FD/memoria.
**Corrección:** Envolver cada `fetch` con `AbortController` + timeout corto (5-10s) y `clearTimeout` al completar. Fijar timeout explícito en el cliente Stripe: `new Stripe(secret, { timeout: 10000 })`.

### [LOW] El `session_id` de Stripe en la URL de éxito se envía a Vercel Analytics y se filtra por Referer
**Archivo:** `client/src/pages/PaymentSuccessPage.jsx:8; server/index.js:381`
**Riesgo:** `success_url` es `${origen}/pedido/exito?session_id={CHECKOUT_SESSION_ID}`, así que el `session_id` queda en la URL del navegador. `main.jsx:21` monta `<Analytics/>` (@vercel/analytics), que reporta rutas completas con query a un tercero, y cualquier asset externo lo llevaría en el header Referer. Ese `session_id` es exactamente el secreto que acepta el `/api/orders/confirm` no autenticado; quien lo tenga puede obtener id y total del pedido.
**Corrección:** Poner `Referrer-Policy: no-referrer` en la ruta de éxito y quitar `session_id` de la URL tras confirmar (`history.replaceState`). Considerar pasar la referencia por un valor efímero puesto por el servidor en lugar del query string.

### [LOW] `robots.txt` publicita las rutas `/admin` y `/pedido`
**Archivo:** `client/public/robots.txt:2-3`
**Riesgo:** `robots.txt` hace `Disallow: /admin` y `Disallow: /pedido`, revelando públicamente la ubicación del panel de admin (los atacantes leen robots.txt primero). Es divulgación, no compromiso directo — el control real es el `/api/orders` con token — pero elimina toda oscuridad y apunta a la superficie de login/fuerza-bruta.
**Corrección:** Servir el panel desde una ruta no listada, o eliminar la línea `/admin`. Confiar en el token de la API como control, sin señalizar el panel.

### [LOW] El workflow de backup semanal guarda un dump completo de la BD de clientes como artefacto de GitHub de 90 días
**Archivo:** `.github/workflows/backup-pedidos.yml:26`
**Riesgo:** El job programado hace `pg_dump` de la BD de pedidos y sube `pedidos.sql.gz` vía `actions/upload-artifact@v4` con `retention-days: 90`. El artefacto contiene todo el PII (nombres, emails, direcciones, detalles). Cualquiera con acceso de lectura/Actions al repo, o quien comprometa un token de workflow, descarga toda la base de clientes durante 90 días. Las actions están fijadas a tags mayores mutables (`@v4`) en vez de SHAs.
**Corrección:** Cifrar el dump antes de subirlo (gpg con clave pública en secreto de repo) o enviarlo a almacenamiento privado con control de acceso; acortar retención; restringir acceso a artefactos. Fijar las third-party actions por commit SHA.

### [LOW] Rangos caret (`^`) en paquetes de servidor críticos permiten drift silencioso de minor/patch en cada redeploy
**Archivo:** `server/package.json:15`
**Riesgo:** `stripe`, `express`, `helmet`, `pg`, `express-rate-limit`, `cors`, `nodemailer` usan rangos caret. Existe `package-lock.json` y CI usa `npm ci` (respeta el lock), lo que lo mitiga en CI. Pero no hay `render.yaml`, así que el build de Render se configura en el dashboard; si Render construye con `npm install` e ignora/regenera el lock, un parche comprometido (p.ej. un `express-rate-limit` malicioso o una transitiva secuestrada) se instala automáticamente en el siguiente deploy, ejecutando código en la API que procesa pagos y guarda secretos de Stripe/BD.
**Corrección:** Asegurar que el comando de build/install de Render sea `npm ci` (no `npm install`); commitear un `render.yaml` con `buildCommand: npm ci`. Opcionalmente fijar versiones exactas para `stripe`/`express`/`helmet`/`pg`. Habilitar Dependabot/`npm audit` en CI.

### [INFO] Codificación de salida completa: todas las interpolaciones derivadas del cliente están escapadas y todo el SQL es parametrizado
**Archivo:** `server/email.js:21; server/notify.js:30; server/db.js:54`
**Riesgo:** No hay ataque práctico. Auditado línea a línea: en `email.js` cada campo del cliente va en `escapeHtml` (nombre, l.nombre, direccion/cp/ciudad, email, telefono); los campos numéricos vienen de `validarPedido` como `Number`. En `notify.js` todo campo a Telegram (parse_mode HTML) está escapado. `db.js` usa placeholders `$1/$2/$3` y pasa el objeto pedido como parámetro ligado. `AdminPage.jsx` y demás páginas no usan `dangerouslySetInnerHTML`, así que React auto-escapa. No queda interpolación de cliente sin escapar en la superficie de inyección.
**Corrección:** Sin cambios. Mantener `escapeHtml` en cada nuevo campo de cliente que se añada a una plantilla.

### [INFO] `pedido.id` interpolado en asunto/cuerpo de email y Telegram sin `escapeHtml`
**Archivo:** `server/email.js:23, 175, 192, 197`
**Riesgo:** No explotable hoy — `id` es generado por el servidor (`'CU-'+Date.now()...`) y solo contiene `[A-Z0-9-]`, seguro en todo contexto incluyendo la cabecera Subject. Nota de consistencia: cualquier cambio futuro que meta input de cliente en el id (referencia de pedido custom) lo convertiría silenciosamente en un sink de inyección HTML/cabeceras.
**Corrección:** Por defensa en profundidad, envolver `pedido.id` en `escapeHtml` (como hace `notify.js:33`) y quitar saltos de línea al construir el asunto.

### [INFO] Cuerpos de error del proveedor (pueden reflejar el email del destinatario) se interpolan en errores lanzados/logueados
**Archivo:** `server/email.js:118`
**Riesgo:** `enviarCorreo` lanza `new Error('Brevo respondió ${res.status}: ${await res.text()}')`; el cuerpo de Brevo suele reflejar el payload incluyendo el email del destinatario. Se loguea vía `console.error`. Es logging solo servidor (no llega al cliente), pero deposita PII de clientes en el store de logs del hosting donde antes no estaba.
**Corrección:** Loguear el código de estado y un motivo truncado/saneado en vez del cuerpo completo; mantener las direcciones fuera de las cadenas de error que llegan al log.

### [INFO] Origen de la API de Render hardcodeado en el config del cliente; la allowlist CORS no protege el acceso directo a la API
**Archivo:** `client/vercel.json:3`
**Riesgo:** `vercel.json` expone el origen real `https://chargerup-api.onrender.com` (también en el repo público). Como el front llega a la API same-origin vía el rewrite de Vercel, la allowlist CORS del servidor nunca es una barrera para tráfico legítimo y da cero protección contra clientes no-navegador que golpean la URL de Render directamente. Los únicos controles reales son el token (`requiereAdmin`) y los rate-limiters.
**Corrección:** Tratar CORS como no-seguridad. Asegurar que cada endpoint que muta estado o es costoso tenga su propia auth y/o rate-limit en la capa de API; considerar un secreto compartido/chequeo de edge para que Render solo confíe en peticiones proxeadas por Vercel.

### [INFO] Verificado limpio: sin secretos, sin source maps, sin enumeración de pedidos no autenticada
**Archivo:** `client/dist/assets/index-C6YjVS2r.js`
**Riesgo:** Confirmaciones a registrar: (1) sin API keys/secretos en el bundle (grep de `sk_/pk_/whsec_/AKIA` sin resultados; src no usa `import.meta.env`/`VITE_`). (2) sin `.map` en dist. (3) los IDs `CU-<Date.now base36>` son predecibles pero NO hay endpoint de lookup-por-id no autenticado — `/api/orders` requiere token y `/api/orders/confirm` usa el `session_id` inadivinable, así que los pedidos no se enumeran por id `CU-`. (4) el admin renderiza PII como texto React. (5) el service worker deniega `/admin` y `/api` y solo cachea `/api/products`.
**Corrección:** Ninguna. Mantener el build sin source-maps, los secretos en servidor y la superficie de lookup con token.

### [INFO] Avisos de vite/esbuild son solo del dev-server y no afectan al sitio estático desplegado
**Archivo:** `client/package.json:24`
**Riesgo:** `npm audit` reporta vite <=6.4.2 HIGH y esbuild <=0.24.2 MODERATE (instalados vite 5.4.21, esbuild 0.21.5), pero cada uno es una propiedad del servidor de DESARROLLO. La app despliega la salida de `vite build` (estático) a Vercel; el dev-server nunca corre en producción, así que ninguno es alcanzable por un atacante de internet contra el sitio vivo. El riesgo residual es local del desarrollador con `npm run dev` activo.
**Corrección:** Aceptar para producción. Para dev, atar el dev-server a `127.0.0.1` (por defecto) y evitar `--host`. El fix oficial es vite 8.1.4 (major desde `^5`), no justificado solo por CVEs de dev-server. No ejecutar `npm audit fix --force`.

### [INFO] El postinstall de esbuild ejecuta descarga arbitraria en tiempo de instalación (el warning marcado)
**Archivo:** `client/node_modules/esbuild/package.json`
**Riesgo:** `esbuild@0.21.5` declara un hook `postinstall` (`node install.js`) que descarga un binario nativo durante `npm install`. Es un paquete legítimo, pero es una superficie de ejecución de código en install/CI: un parche comprometido de esbuild se ejecutaría con privilegios de usuario/CI. Confinado a máquinas de build/CI; el artefacto estático de producción y la API de Render no se ven afectados. Ninguna dependencia del servidor tiene scripts de install.
**Corrección:** Mantener el `package-lock.json` autoritativo e instalar con `npm ci`. Opcionalmente `npm config set ignore-scripts true` en el cliente donde no se necesite el binario nativo. Sin acción más allá de retener el lockfile.

## Correcciones recomendadas ahora

1. Añadir guard `if (EN_PRODUCCION && !CLIENT_URL) process.exit(1)` en `server/index.js` y dejar de derivar `success_url`/`cancel_url` de `req.headers.origin`.
2. Hacer `EN_PRODUCCION` *fail-closed* en `server/index.js:26` y eliminar el literal `'chargeup123'` (línea 54) y su mención en el README.
3. Verificar el certificado TLS de Postgres en `server/db.js:21` (`ca` + `rejectUnauthorized: true` o `sslmode=verify-full`).
4. Aseverar `session.amount_total === Math.round(v.total*100)` y `currency==='eur'` en `crearPedidoDesdeSesion` (`server/index.js:307-320`) antes de crear el pedido.
5. Añadir bloque `headers` (CSP, `X-Frame-Options: DENY`, HSTS, `Referrer-Policy`) en `client/vercel.json`.
6. Poner un rate-limiter y validación de prefijo `cs_` en `/api/orders/confirm` (`server/index.js:395-415`), y colapsar respuestas de error a una forma genérica.
7. Añadir `POST /api/logout` con `sesiones.delete(token)` en `server/index.js` y llamarlo desde `cerrarSesion()` en `AdminPage.jsx`.
8. Hacer que `guardarPedidoBd` reporte si insertó de verdad y condicionar emails/notificaciones a ello (`server/index.js`/`server/db.js`).
9. Cachear `products.json` en memoria al arrancar en lugar de `readFileSync` por petición (`server/index.js:138-150`).
10. Envolver los `fetch` a Telegram/Brevo con `AbortController` + timeout y fijar `timeout` en el cliente Stripe.
11. Endurecer `REGEX_EMAIL` en `server/validar.js:17` para una sola dirección sin comas.
12. Cifrar el dump de `backup-pedidos.yml` antes de subirlo y acortar `retention-days`; fijar el build de Render a `npm ci` vía `render.yaml`.

## Ya cubierto

- Inyección SQL: todas las consultas de `server/db.js` usan parámetros ligados; las expresiones JSONB son literales estáticos.
- XSS/HTML: todo campo del cliente va con `escapeHtml` en `email.js` y `notify.js`; el panel admin renderiza PII como texto React sin `dangerouslySetInnerHTML`.
- Inyección de cabeceras CRLF en SMTP: bloqueada por el `\S` del regex de email que rechaza espacios en blanco.
- Enumeración de pedidos: no hay lookup por id no autenticado; `/api/orders` exige token y `/api/orders/confirm` usa el `session_id` inadivinable.
- `helmet`, rate-limit en `/api/login` y `/api/checkout`, y allowlist CORS (cuando `CLIENT_URL` está definido) están activos.
- Comparación de contraseña con `timingSafeEqual` (tiempo constante salvo el pre-chequeo de longitud).
- Índice único / `ON CONFLICT DO NOTHING` deduplica correctamente la fila de pedido en la BD.
- Bundle del cliente sin secretos ni source maps; service worker que deniega `/admin` y `/api`.
- Verificación de firma del webhook de Stripe y guards de producción existentes para `ADMIN_PASSWORD` y `DATABASE_URL` (en Render).
- Los CVEs de vite/esbuild son solo del dev-server y no afectan al sitio estático desplegado — no requieren acción en producción.
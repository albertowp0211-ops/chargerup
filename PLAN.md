# Plan de mejora — ChargeUp

> Generado el 2026-07-15 a partir de una auditoria multi-agente del codigo (frontend, backend/seguridad, gaps de e-commerce, rendimiento/SEO/accesibilidad, testing/operaciones y plugins frontend). 73 hallazgos verificados y 57 propuestas.


## Estado actual

El núcleo transaccional es sólido para su tamaño: precios recalculados siempre en servidor, webhook de Stripe con verificación de firma, confirmación idempotente, SQL parametrizado y login de admin con comparación timing-safe y bloqueo por IP. El problema no es la calidad del código (que es limpia y bien comentada), sino todo lo que rodea a la venta: la tienda está desplegada cobrando con tarjeta mientras muestra reseñas inventadas, páginas legales con placeholders `[NIF]`, productos sin fotos (emojis), promesa de envío 24/48h con fulfillment vía AliExpress, y ningún flujo post-compra (sin estado, tracking ni consulta de pedido). Operativamente no hay red de seguridad: cero tests unitarios, sin CI, sin backups de la base de datos, sin monitoring, y el cold start de Render deja el catálogo en blanco al primer visitante. Nada de esto requiere dependencias nuevas significativas; casi todo es trabajo de días, no semanas.

## Fase 1 — Correcciones críticas

Ordenadas por severidad real (legal/seguridad primero, luego integridad de pedidos, luego bugs de pago).

1. **Rellenar la identidad legal** — `client/src/pages/LegalPage.jsx:15,50`. Sustituir `[Nombre completo o razón social] · NIF/CIF: [número] · Domicilio: [dirección completa]` por los datos reales. La LSSI-CE y el RGPD lo exigen en un sitio comercial vivo. Cero esfuerzo de ingeniería.
2. **Eliminar la prueba social fabricada** — `server/data/products.json` (campos `rating`/`reviews` de los 8 productos, mostrados en `ProductsSection.jsx:79-80` y `ProductPage.jsx:76-77`) y `Footer.jsx:12-14` («50.000 clientes desde 2020» con 3 pedidos de prueba). Mostrar recuentos de reseñas inventados es práctica engañosa prohibida (RDL 24/2021). Borrar los contadores y la afirmación; las estrellas vuelven cuando existan reseñas reales (Fase 3).
3. **Quitar la contraseña de admin por defecto** — `server/index.js:25-27`. El fallback `'chargeup123'` está en el repo público y se activa en Render si `ADMIN_PASSWORD` se desconfigura; además un `admin-password.txt` en blanco autentica con contraseña vacía (`timingSafeEqual` de dos buffers vacíos, `index.js:124-126`). Fix: si no hay `ADMIN_PASSWORD` (o mide <12 chars), `console.error` + `process.exit(1)` al arrancar.
4. **Ajustar la promesa «Envío 24/48h»** — `client/src/components/Features.jsx:2`, `ProductPage.jsx:105`. El flujo de admin es dropshipping AliExpress (`AdminPage.jsx:199-204`), con entregas de 1-3 semanas. Prometer 24/48h garantiza disputas y chargebacks. Cambiar el copy a plazos reales hoy; el sistema de estados llega en Fase 3.
5. **Pedidos borrador en servidor (un fix, tres bugs)** — `server/index.js:273-286,327-328` y `server/db.js:30-37`. Hoy el pedido viaja en `metadata` de Stripe truncado a 490 chars (JSON roto → webhook 500 para siempre → pedido pagado no registrado), se revalida contra el catálogo *actual* al confirmar (editar un producto entre checkout y pago pierde o desprecia el pedido), y el webhook y `/api/orders/confirm` pueden duplicar pedidos (check-then-insert sin constraint). Fix: en `/api/checkout`, tras `validarPedido`, persistir el pedido validado como borrador con el session id de Stripe + `UNIQUE INDEX` sobre `(datos->>'stripeSession')` con `ON CONFLICT DO NOTHING`; webhook/confirm solo marcan el borrador como pagado. Añadir de paso límites de longitud por campo, cap de items (50) y regex de email en `validarPedido` (`index.js:173-202`).
6. **Guard de producción para la base de datos** — `server/db.js:12-25`, `server/index.js:364-373`. Sin `DATABASE_URL` el servidor arranca feliz y escribe pedidos pagados en `orders.json` sobre el filesystem efímero de Render. Fix (~6 líneas): si `process.env.RENDER || NODE_ENV==='production'` y no hay `DATABASE_URL` ni `ALLOW_JSON_ORDERS=1`, `process.exit(1)`.
7. **Pack de hardening HTTP** — `server/index.js:47,298`. Sustituir `cors()` abierto por allowlist vía `CLIENT_URL`; validar `req.headers.origin` contra esa misma lista antes de usarlo en `success_url`/`cancel_url` (hoy un atacante obtiene un Checkout real de la tienda que redirige a su página); `express-rate-limit` en `/api/login` y `/api/checkout`; `helmet()`; error handler final de Express + `NODE_ENV=production`.
8. **Escapar input de cliente en emails y Telegram** — `server/email.js:20,54,196-206`, `server/notify.js:29-41`. Nombre/dirección se interpolan sin escapar en HTML (phishing contra el dueño) y un `<` en el nombre hace que Telegram rechace el aviso de venta silenciosamente. Fix: helper `escapeHtml` aplicado a todo valor del cliente.
9. **Parsear la respuesta antes de comprobar `res.ok`** — `CheckoutPage.jsx:39`, `PaymentSuccessPage.jsx:24`, `AdminPage.jsx:63`. Un 502 del proxy de Vercel (HTML) produce el toast «⚠️ Unexpected token '<'…» en el momento de pagar. Fix: `res.json().catch(() => ({}))` y mensaje derivado de `res.status`.
10. **La pantalla de error de confirmación invita a pagar otra vez** — `PaymentSuccessPage.jsx:60-70`. Si falla `/api/orders/confirm`, el único CTA es «Volver a intentarlo» → `/pedido` → nuevo Checkout, aunque el primer cargo pudo completarse. El endpoint de confirm es idempotente: añadir botón «Reintentar confirmación» que resetee `confirmado.current` y re-POSTee el mismo `session_id`; degradar o eliminar el enlace a `/pedido`.
11. **Botón de checkout atascado en «Procesando…»** — `CheckoutPage.jsx:28,41`. Volver de Stripe con el botón Atrás restaura la página desde bfcache con `enviando=true`. Fix: listener `pageshow` que haga `setEnviando(false)` cuando `e.persisted`.

## Fase 2 — Mejoras rápidas de conversión y SEO

Todas de esfuerzo S, sin dependencias nuevas salvo donde se indica.

- **Catálogo sin cold start en blanco** — `ProductsSection.jsx:8-20`: añadir estado `cargando` + skeleton cards en CSS; `res.set('Cache-Control','s-maxage=300, stale-while-revalidate=86400')` en `GET /api/products` (`server/index.js:102-104`) para que el edge de Vercel absorba los cold starts; ping a `/api/health` en `main.jsx` al cargar.
- **`allow_promotion_codes: true`** en `stripe.checkout.sessions.create` (`server/index.js:320-332`). Una línea que desbloquea promos, códigos de influencers y cupones gestionados desde el dashboard de Stripe.
- **Pack SEO estático** — crear `client/public/` con `robots.txt` (Disallow: /admin + línea Sitemap), `sitemap.xml` generado por script de 30 líneas desde `products.json`, favicon.svg + apple-touch-icon; añadir a `client/index.html` meta description, OG/twitter tags, canonical y `theme-color`. Hoy `/robots.txt` y `/favicon.ico` devuelven el HTML de la SPA (catch-all de `vercel.json:4`).
- **Títulos por página + JSON-LD** — hook `usePageMeta(title, description)` de ~40 líneas sin dependencias (rechazar react-helmet-async, sin mantenimiento); en `ProductPage` inyectar JSON-LD Product/Offer (precio, EUR, disponibilidad).
- **Code splitting por ruta** — `App.jsx:2-10`: `React.lazy` para AdminPage, LegalPage y páginas de checkout + un `<Suspense>`. El panel de admin deja de viajar en el bundle de 204 KB de cada comprador.
- **Ruta 404 + scroll restoration** — `App.jsx:19-27`: `<Route path="*">` reutilizando el patrón empty-state de `LegalPage.jsx:128-137`, y componente `ScrollToTop` (los enlaces del footer hoy abren las páginas legales scrolleadas al fondo).
- **Enlaces muertos** — `Navbar.jsx:28`, `Footer.jsx:19-22,36-38`: `mailto:`/`tel:` reales, categorías apuntando a `/#catalogo` (o `?cat=` cuando exista el deep-linking de Fase 3), quitar Instagram hasta que exista.
- **Autocomplete en el checkout** — `CheckoutPage.jsx:74-94`: `autocomplete="name|email|tel|street-address|address-level2|postal-code"` + `inputMode="numeric"` en el CP. El punto de mayor fricción del funnel en móvil.
- **Pase de accesibilidad** — aria-labels en todos los controles de icono (`Navbar.jsx:30-46`, `CartPage.jsx:38-49`, `ProductPage.jsx:95-97`), `role="status" aria-live="polite"` en el toast (`ToastContext.jsx:21` — hoy los errores de checkout son mudos para lectores de pantalla), estrellas con `aria-label` numérico, contraste de `.tag`/`.stars` (`index.css:159-166` → `#047857`, `#b91c1c`, `#b45309`), `:focus-visible` en vez de `outline:none`, `@media (prefers-reduced-motion)`, y `max-width` + `white-space:normal` en `.toast` (desborda en 375px).
- **Centralizar el umbral de envío gratis** — 25€/4,99€ está en 7 sitios (`App.jsx:16`, `CartPage.jsx:62-66`, `CheckoutPage.jsx:21`, `ProductPage.jsx:105`, `Features.jsx:2`, `LegalPage.jsx:98`, `server/index.js:199`). Crear `client/src/config.js`; ideal, servirlo desde `GET /api/config`.
- **«IVA incluido» junto a los totales** — `CartPage.jsx`, `CheckoutPage.jsx`, `ProductPage.jsx`. Obligatorio en precios al consumidor en España; una línea de texto.
- **Analítica sin cookies** — activar Vercel Web Analytics (+`@vercel/analytics`, Fase 4). No usar Google Analytics: obligaría a banner de cookies y contradice la política de privacidad publicada (`LegalPage.jsx:87`).
- **Búsqueda sobre descripción y características** — `ProductsSection.jsx:32`: hoy «GaN» o «MacBook» no encuentran nada; extender el haystack una línea y mostrar 2-3 bestsellers bajo «No hay productos».

## Fase 3 — Nuevas funcionalidades

### Tienda

- **Fotos reales de producto (M)** — la mejora de conversión más grande disponible: hoy todo son emojis (`products.json:4` y equivalentes). Campo `imagenes: []` con WebP autoalojados en `client/public/img/`; `<img loading="lazy" width height alt>` en cards/detalle/carrito con el emoji como fallback; misma URL en `og:image` y JSON-LD. Prerequisito de la galería (Fase 4) y de los rich results.
- **Barra de progreso de envío gratis (S)** — en el resumen de `CartPage.jsx`: «Te faltan 7,01 € para el envío gratis» calculado desde la constante compartida de Fase 2. Palanca clásica de ticket medio.
- **Cross-sell en el carrito (S)** — fila «Completa tu pedido» con 2-3 mini-cards (productos baratos si el subtotal < 25€), reutilizando `/api/products` y `addItem()`.
- **Toast accionable (S)** — `ToastContext.jsx`: acción opcional `{label, to}` con `<Link>` «Ver carrito» y timeout de ~4s; llamado desde `ProductsSection.jsx:92` y `ProductPage.jsx:62`.
- **Deep-linking de categoría y búsqueda (M)** — `ProductsSection.jsx`: `useSearchParams` (`?cat=`, `?q=`) en vez de `useState`; da vida a los enlaces de categoría del footer y preserva el filtro con el botón Atrás.
- **ProductsContext con fetch único (M)** — `context/ProductsContext.jsx` con caché; elimina los refetches por navegación (`ProductPage.jsx:14-19`) y habilita reconciliar los precios guardados en localStorage del carrito (`CartContext.jsx:27-36`), que hoy pueden divergir de lo que cobra Stripe.
- **Flag `disponible` + badge «Agotado» (S)** — campo booleano en `products.json`, rechazo en `validarPedido` (`server/index.js:183`), botón deshabilitado en cliente. Para dropshipping basta el booleano; los stockouts del proveedor son rutina.
- **Página de contacto + FAQ (S)** — ruta `/contacto` con formulario a un nuevo `/api/contact` que reutiliza el transporte nodemailer/Brevo de `server/email.js`; FAQ como cuarta entrada del mapa `PAGINAS` de LegalPage.
- **Datos de envío recordados (S)** — guardar `cliente` (sin datos de pago) en localStorage al enviar el checkout e hidratar el formulario al volver, con enlace «limpiar».

### Panel admin

- **Estados de pedido + tracking + email «enviado» (M)** — la mayor reducción de soporte y chargebacks: añadir `estado` (`pagado → enviado → entregado / cancelado`) y `tracking` al pedido (`guardarPedido`, `server/index.js:206-224`; JSONB no necesita migración); `PATCH /api/orders/:id/estado` tras el middleware `requiereAdmin` existente (`index.js:144`); dropdown + input de tracking en `AdminPage`; email de envío reutilizando la plantilla de `email.js`.
- **Mini-dashboard de ventas (S)** — `AdminPage` ya tiene todos los pedidos en cliente: agrupar por día (30 días) y renderizar un bar chart SVG puro + top-5 productos, ~80 líneas, cero cambios de servidor.
- **Editor de productos / catálogo en PostgreSQL (L)** — hoy cambiar un precio exige editar JSON y redesplegar. Tabla `productos` JSONB siguiendo el patrón de `pedidos` en `db.js` (fallback JSON en local), `PUT /api/products/:id` protegido, segunda pestaña en AdminPage. Desbloquea el flag de disponibilidad y el cambio de fotos sin deploy.

### Post-compra

- **Consulta pública de estado de pedido (M)** — `GET /api/orders/:id?email=` que solo responde si el email coincide, devolviendo id/fecha/estado/líneas/totales (sin dirección); página `/pedido/estado` enlazada desde `PaymentSuccessPage` y el footer.
- **Cupón post-compra (S)** — código «GRACIAS10» creado en Stripe (depende de `allow_promotion_codes`, Fase 2) + un párrafo en la plantilla del email de confirmación y en `PaymentSuccessPage`.
- **Recuperación de checkout abandonado (M)** — `/api/checkout` ya captura el email antes de la redirección: persistir «checkout iniciado» con el session id, barrido al arrancar/`setInterval` que localice sesiones >24h sin pedido vía `buscarPorStripeSession` y envíe un único email con enlace de restauración del carrito. Requiere párrafo en la política de privacidad.
- **Reseñas verificadas (L)** — sustituye la prueba social eliminada en Fase 1: tabla de reseñas (patrón `db.js`), enlace tokenizado en el email de envío/entrega para que solo compradores verificados opinen, media real en `ProductPage`.
- **Newsletter + código de bienvenida (M)** — input en el footer → `/api/newsletter` (tabla JSONB o contacto en Brevo con la API key ya configurada) + cupón de bienvenida en Stripe. Checkbox de consentimiento y actualización de la política de privacidad.

## Fase 4 — Plugins frontend a incorporar

Antes de cualquier plugin: hacer el code splitting con `React.lazy` y el hook `usePageMeta` de Fase 2 — ambos a coste cero.

| Plugin | Versión | Comando | Para qué | Coste en bundle |
|---|---|---|---|---|
| rollup-plugin-visualizer | 7.0.1 | `npm i -D rollup-plugin-visualizer` | Ver la composición del bundle de 204 KB y verificar el code splitting (`stats.html` con gzip/brotli) | 0 KB (solo build; con Node 18/20 fijar la v6) |
| @vercel/analytics | 2.0.1 | `npm i @vercel/analytics` | Analítica sin cookies (páginas, referrers, Web Vitals) sobre el hosting ya existente; sin banner GDPR | ~1-2 KB gzip |
| vite-plugin-pwa | 1.3.0 | `npm i -D vite-plugin-pwa` | Manifest + icono home-screen + shell precacheado. Opcional; configurar `NetworkFirst` para `/api/products` y denylist de `/api` y `/admin` | ~1 KB (SW aparte) |
| embla-carousel-react | 8.6.0 | `npm i embla-carousel-react` | Galería swipeable en la página de producto. **Bloqueado hasta que existan fotos reales** (Fase 3) | ~7 KB gzip |

**Descartados y por qué**: `vite-plugin-compression` (el edge de Vercel ya comprime e ignora/rompe assets precomprimidos), `@vitejs/plugin-legacy` (el target de Vite 5 ya cubre todo Android desde ~2018; duplicaría la salida del build), `framer-motion` (~34 KB para efectos que el CSS actual hace gratis), `swiper` (3-6x el tamaño de Embla sin necesidad), `react-helmet-async` (sin mantenimiento; el hook propio basta), wrappers de lazy-load (`loading="lazy"` nativo cuesta 0 KB).

En servidor (npm, no frontend): `express-rate-limit` y `helmet`, ya recogidos en el hardening de Fase 1.

## Fase 5 — Calidad y operaciones

Aproximadamente un día de trabajo cierra todos los huecos operativos sin dependencias de runtime nuevas.

- **Tests unitarios con `node:test` (M)** — cubrir la lógica que toca dinero, hoy sin ninguna cobertura: `validarPedido` (`server/index.js:173-202` — campos vacíos, qty 0/100/1.5, id desconocido, umbral de envío en 24,99 vs 25,00) y la deduplicación de `crearPedidoDesdeSesion` (`index.js:273-286`). Extraer a un módulo pequeño si hace falta.
- **CI con GitHub Actions (S)** — un workflow de ~30 líneas en push/PR: `npm ci` en client y server, `vite build`, `node --test server/test/`, arrancar el server sin `DATABASE_URL` y `curl -f /api/health`. Hoy no existe `.github/` y `npm test` falla por script inexistente.
- **Endurecer el E2E existente (S)** — `scripts/compra-prueba.mjs`: añadir `"test:e2e"` al package.json raíz, documentar `TIENDA_URL` y `npx playwright install chromium`, coger el primer producto de `/api/products` en vez del id 5 hardcodeado, marcar visualmente en AdminPage los pedidos «Compra Automática E2E», y arreglar la condición duplicada muerta de la línea 61 (`'Pago completado'.normalize()` sobre el literal — la intención era `texto.normalize()`).
- **Monitor de uptime (S, sin código)** — UptimeRobot gratuito sobre `https://chargerup-api.onrender.com/api/health` cada 5 min: mantiene caliente el dyno de Render (mitiga el cold start para todos) y avisa por email si la API cae. Configurar la misma ruta como health check en Render.
- **Backup semanal de pedidos (S)** — workflow de Actions con `on: schedule` que ejecute `pg_dump "$DATABASE_URL"` (secret del repo) y suba el dump como artifact (retención 90 días). Hoy la Postgres de Render es la única copia estructurada del historial necesario para envíos, devoluciones (política de 30 días) e impuestos.
- **Alertas de error por Telegram (S)** — `notificarError(contexto, err)` en `server/notify.js` reutilizando el bot de ventas, llamado desde los catch del webhook (`index.js:83-86`), de `/api/checkout` (`index.js:334-337`) y de `process.on('unhandledRejection')`, con rate-limit de 1 msg/min. Hoy un webhook secret roto o una key de Brevo caducada se pierde en logs efímeros de Render.
- **Pinning y documentación (S)** — `"engines": { "node": ">=20 <23" }` en ambos package.json + `.node-version`; `server/.env.example` y tabla de variables en el README (faltan `CLIENT_URL`, `PORT`, `TIENDA_URL`); corregir el comentario obsoleto de ntfy en `index.js:242`; `render.yaml` de ~15 líneas para que el deploy sea reproducible; TLS de pg sin `rejectUnauthorized: false` por defecto (`db.js:21`).
- **Lint mínimo (S)** — Prettier con config por defecto + ESLint flat con `eslint:recommended` y `react-hooks`, ambos en el workflow de CI. Nada más pesado: el tamaño del código no lo justifica.
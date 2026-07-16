# Requisitos para lanzar la tienda en España (ChargeUp — nombre provisional)

> ⚠️ **Aviso.** Estos textos son plantillas orientativas elaboradas a partir de la normativa española y europea vigente en 2026, y NO constituyen asesoramiento jurídico. Antes de publicarlos es imprescindible: (1) sustituir todos los tokens ({{MARCA}}, {{DOMINIO}}, {{EMAIL}}, {{RAZON_SOCIAL}}, {{NIF}}, {{DOMICILIO}}, {{TELEFONO}}) por los datos reales del negocio, sin inventar ninguno; (2) revisar los textos con un abogado o asesor especializado, prestando especial atención a los dos focos de mayor riesgo de este modelo concreto: las transferencias internacionales de datos (Render, Vercel y el aviso a Telegram) y la gestión aduanera e IVA/IOSS del dropshipping desde China; y (3) confirmar detalles que dependen de tu comunidad autónoma (hojas de reclamaciones) y de tus decisiones comerciales (adhesión o no al Sistema Arbitral de Consumo, dirección de devolución y quién asume el coste). {{MARCA}} es en todo caso el vendedor y único responsable frente al consumidor, incluida la garantía legal de 3 años.

Este documento reúne todo lo necesario para que la tienda funcione y sea legal en España. Se divide en **lo que ya está resuelto en la web** (código) y **lo que depende de ti** (negocio, datos y trámites). Fecha: julio de 2026.

---

## ✅ Ya implementado en la web

Estas obligaciones ya están cubiertas por el código de la tienda:

- **Páginas legales completas y enlazadas en el pie**: Aviso Legal, Política de Privacidad, Política de Cookies, Condiciones Generales de Contratación, Derecho de Desistimiento y Devoluciones, y Envíos y Devoluciones (`client/src/legal-textos.js`).
- **Casilla de consentimiento no premarcada** en el checkout (condiciones + privacidad) que bloquea el pago hasta aceptarla.
- **Botón de pago con fórmula inequívoca**: "Pagar ahora" (art. 98.2 TRLGDCU).
- **Resumen precontractual antes de pagar**: precio con IVA, gastos de envío, total y **plazo de entrega estimado (5-10 días)** con aviso de envío internacional.
- **Plazos de entrega**: eliminada toda mención a "24/48h"; se informa de 5-10 días en la ficha de producto y el checkout. ⚠️ Este plazo solo es legal si tu proveedor lo cumple de verdad; si no, anunciarlo sería práctica comercial engañosa.
- **Sin enlace a la plataforma ODR** (cerrada el 20/07/2025); cláusula de reclamaciones y ADR actualizada (OMIC, juntas arbitrales, CEC).
- **Desistimiento en línea** (Directiva UE 2023/2673, en vigor desde 06/2026): formulario en `/desistir` + endpoint `/api/desistimiento` que verifica el pedido y envía un **acuse de recibo con fecha y hora** por email.
- **Minimizada la fuga de datos a Telegram**: el aviso de venta ya NO envía nombre, ciudad ni CP del cliente.
- **Sin banner de cookies** (correcto: solo almacenamiento funcional + analítica sin cookies), con la Política de Cookies que lo declara.
- **Indicador de disponibilidad** ("Agotado") en vez de contador de stock falso; sin reseñas inventadas ni contadores de urgencia.
- **Marca y datos de empresa centralizados** en `client/src/config.js` (cambiar el nombre y rellenar NIF/domicilio en un solo sitio).

---

## ☐ Lo que tienes que hacer tú (antes de vender)

Marca cada punto al completarlo. Los 24 obligatorios son imprescindibles para operar legalmente.

### 🏛️ Negocio y fiscalidad

- [ ] **Alta en Hacienda (modelo 036/037) y epígrafe IAE de comercio al por menor** — Darse de alta en el censo de empresarios antes de vender. Sin alta fiscal la actividad es ilegal. La obligación es del negocio, no de la web.
- [ ] **Alta de autónomo en RETA o constitución de sociedad** — Si el titular es persona física, alta en el Régimen Especial de Trabajadores Autónomos. Si es sociedad, constitución e inscripción en el Registro Mercantil.
- [ ] **Registro y liquidación del IVA (repercutido) y conservación de facturas** — Declarar el IVA de las ventas a consumidores en España. Conservar facturas y documentación mercantil 4-6 años.
- [ ] (recomendado) **Registro en IOSS (Ventanilla Única de Importación) y control del límite de 150 € por pedido** — Para que 'IVA incluido / precio final' sea cierto en dropshipping desde China, conviene registrarse en IOSS, cobrar el IVA español en el checkout y que el paquete despache en aduana sin cargos al cliente. IOSS solo cubre pedidos de valor intrínseco menor o igual a 150 €. Recomendable, prácticamente imprescindible para no incumplir la promesa de precio final.

### 💳 Técnico y pago

- [ ] **Cuenta Stripe verificada y en modo live** — Completar la verificación KYC de Stripe (identidad, cuenta bancaria, datos fiscales del negocio) y pasar de claves de test a claves live. Configurar el webhook checkout.session.completed en producción.

### 🌐 Datos que deben aparecer en la web

- [ ] **Datos reales de identificación del titular publicados en el Aviso Legal** — Razón social / nombre y apellidos, NIF/CIF, domicilio en España, email de contacto y teléfono. Sustituir los tokens {{RAZON_SOCIAL}}, {{NIF}}, {{DOMICILIO}}, {{EMAIL}}, {{TELEFONO}} por datos reales. Si es sociedad inscrita, datos registrales.
- [ ] **Dominio propio y correo de contacto asociado** — Contratar {{DOMINIO}} y un buzón {{EMAIL}} operativo que sea medio de comunicación directa y efectiva (art. 10 LSSI). El email debe atenderse en plazo razonable.
- [ ] **Precio total con IVA y gastos de envío visibles antes de pagar** — Mostrar precio final con IVA incluido, gastos de envío (gratis desde 25 €, si no 4,99 €) y plazo de entrega real antes de que el consumidor quede vinculado (art. 97 TRLGDCU).
- [ ] **Plazo de entrega honesto y origen del envío** — La web anuncia 5-10 días. Anunciar un plazo que el proveedor no cumple (o "24/48h"/"envío express") es práctica comercial engañosa. Confirma con tu proveedor que 5-10 días es realista; si no lo es, súbelo al plazo real. Informar siempre de que se envía desde fuera de la UE.

### 🔒 Protección de datos (RGPD)

- [ ] **Política de Privacidad completa enlazada en el pie y en el checkout** — Responsable, finalidades, bases jurídicas, encargados/destinatarios (Stripe, Brevo/SMTP, Render, Vercel, Telegram), transferencias internacionales a EE. UU., plazos de conservación, derechos y AEPD.
- [ ] **Registro de Actividades de Tratamiento (RAT) documentado internamente** — Documento interno obligatorio (art. 30 RGPD): la excepción para menos de 250 empleados no aplica porque el tratamiento de pedidos no es ocasional. No se publica.
- [ ] **Contratos de encargado de tratamiento (art. 28 RGPD) con todos los proveedores** — Firmar/aceptar el DPA con Stripe, Brevo/proveedor SMTP, Render y Vercel. Documentar la garantía de transferencia internacional (EU-US Data Privacy Framework o Cláusulas Contractuales Tipo) para Render y Vercel (EE. UU.).
- [ ] **Casilla de consentimiento NO premarcada en el checkout** — Añadir una casilla obligatoria, sin premarcar, de aceptación de las Condiciones de Contratación y la Política de Privacidad antes de poder pagar.
- [ ] **Cubrir o minimizar la fuga de PII del cliente a Telegram** — La alerta de venta envía nombre + ciudad + CP del cliente a Telegram (fuera de la UE). Debe constar como destinatario/transferencia en la política y el RAT, y conviene minimizar el dato (p. ej. solo id de pedido e importe).
- [ ] **Procedimiento de notificación de brechas de seguridad (72 h a la AEPD)** — Tener definido cómo detectar y notificar una brecha a la AEPD en 72 h (art. 33 RGPD) y, si hay alto riesgo, a los afectados.
- [ ] (recomendado) **Delegado de Protección de Datos (DPO)** — NO obligatorio para esta tienda (no hay tratamiento a gran escala ni categorías especiales ni supuestos del art. 34 LOPDGDD). Basta designar un punto de contacto de privacidad.

### 📄 Contenido legal y prácticas comerciales

- [ ] **Aviso Legal (LSSI, art. 10)** — Página propia, accesible de forma permanente desde el pie.
- [ ] **Política de Cookies / almacenamiento local** — Aunque no se requiere banner (todo es almacenamiento funcional exento y analítica sin cookies), el deber de información del art. 22.2 LSSI obliga a declararlo.
- [ ] **Condiciones Generales de Contratación** — Página con proceso de compra, precios con IVA, envío y plazos reales, pago, formación del contrato, garantía legal 3 años, desistimiento y reclamaciones. No existe actualmente en la web: hay que crearla.
- [ ] **Política de Desistimiento y Devoluciones con modelo de formulario** — Derecho legal de 14 días + modelo de formulario del Anexo B + política comercial ampliada de 30 días + quién paga la devolución.
- [ ] **Página de Envíos y Devoluciones con plazos honestos** — Plazo de dropshipping publicado (5-10 días, verifícalo con tu proveedor), envío gratis desde 25 €, resumen de garantía y devoluciones.
- [ ] **Botón de pedido con fórmula inequívoca de obligación de pago** — El botón que cierra la compra debe leerse 'Pedido con obligación de pago' o 'Pagar ahora' (art. 98.2). 'Confirmar' o 'Continuar' no valen.
- [ ] **Cláusula de reclamaciones y resolución alternativa de litigios actualizada** — Informar de hojas de reclamaciones y de las vías ADR. NO enlazar la plataforma ODR europea: está cerrada desde el 20/07/2025 (Reglamento UE 2024/3228). Mantener su enlace sería un riesgo de práctica engañosa.
- [ ] **Botón de desistimiento en línea ('Desistir del contrato aquí')** — La Directiva UE 2023/2673 exige una función de desistimiento en línea con acuse de recibo con fecha y hora, aplicable desde el 19/06/2026. Planificar su implementación (formulario nº de pedido + email, dado que no hay cuentas).
- [ ] **Cumplir la regla del precio más bajo de los últimos 30 días en descuentos** — Si se muestran precios tachados o porcentajes de descuento, el precio anterior debe ser el más bajo aplicado en los 30 días previos (art. 20.1 LOCM). Guardar histórico de precios y no inflar antes de una oferta.
- [ ] **Evitar reseñas sin verificar y contadores de urgencia/escasez falsos** — Prohibido por la Directiva Ómnibus presentar reseñas como de compradores reales sin verificarlo (no importar reseñas de AliExpress como propias) y mostrar 'quedan X unidades' o cuentas atrás no ciertas.


---

## 🔧 Ajustes que quedan pendientes de una decisión o dato tuyo

1. **Rellena `client/src/config.js`** → `MARCA`, `DOMINIO`, `EMAIL_CONTACTO` y el objeto `EMPRESA` (razón social, NIF, domicilio, teléfono). Mientras estén vacíos, las páginas legales muestran "[PENDIENTE: …]" en rojo para que no se publiquen incompletas.
2. **Regla del precio de los últimos 30 días** (art. 20.1 LOCM): los badges "-30%" usan el campo `precioAntes` de cada producto. Ese `precioAntes` debe ser el **precio más bajo aplicado en los 30 días previos**; no lo infles antes de una oferta. Si no llevas ese histórico, quita los `precioAntes` de `server/data/products.json`.
3. **IOSS / IVA de importación**: las Condiciones afirman que no habrá cargos en aduana. Eso solo es cierto si te registras en IOSS y mantienes cada pedido por debajo de 150 €. Si no, ajusta el texto de Condiciones/Envíos (`client/src/legal-textos.js`).
4. **Reembolsos**: hoy se hacen desde el panel de Stripe. Si quieres un botón de reembolso en el panel de admin, se puede añadir (Stripe Refund sobre la sesión de pago).
5. **Al renombrar la marca**, actualiza también `client/index.html` (título y Open Graph), `client/vite.config.js` (manifest PWA) y la marca en los correos del servidor.
6. **Firma los DPA** (contratos de encargado) con Stripe, Brevo, Render y Vercel, y guarda la garantía de transferencia internacional (Data Privacy Framework / cláusulas tipo) para los proveedores de EE. UU.

import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { escapeHtml } from './escape.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUTA_CONFIG = join(__dirname, 'data', 'email-config.json');
const CARPETA_DEV = join(__dirname, 'data', 'emails');

const euros = (n) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

// Plantilla HTML del correo de confirmación.
const plantilla = (pedido) => `
<div style="max-width:560px;margin:0 auto;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
  <div style="background:#0f172a;border-radius:14px 14px 0 0;padding:22px 28px;">
    <span style="color:#fff;font-size:20px;font-weight:800;">Charge<span style="color:#60a5fa;">Up</span> ⚡</span>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 14px 14px;padding:28px;">
    <h1 style="font-size:21px;margin:0 0 8px;">¡Gracias por tu pedido, ${escapeHtml(pedido.cliente.nombre)}!</h1>
    <p style="color:#64748b;font-size:14px;margin:0 0 20px;">
      Hemos recibido tu pedido <b style="color:#2563eb;">${pedido.id}</b> y lo estamos preparando.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left;color:#64748b;font-size:12px;padding:8px;border-bottom:1px solid #e2e8f0;">Producto</th>
          <th style="text-align:center;color:#64748b;font-size:12px;padding:8px;border-bottom:1px solid #e2e8f0;">Cant.</th>
          <th style="text-align:right;color:#64748b;font-size:12px;padding:8px;border-bottom:1px solid #e2e8f0;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${pedido.lineas
          .map(
            (l) => `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;">${escapeHtml(l.nombre)}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">${l.qty}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">${euros(l.subtotal)}</td>
        </tr>`
          )
          .join('')}
        <tr>
          <td colspan="2" style="padding:10px 8px;color:#64748b;">Envío</td>
          <td style="padding:10px 8px;text-align:right;">${pedido.envio === 0 ? 'Gratis' : euros(pedido.envio)}</td>
        </tr>
        ${
          pedido.descuento > 0
            ? `<tr>
          <td colspan="2" style="padding:10px 8px;color:#16a34a;">Descuento</td>
          <td style="padding:10px 8px;text-align:right;color:#16a34a;">−${euros(pedido.descuento)}</td>
        </tr>`
            : ''
        }
        <tr>
          <td colspan="2" style="padding:10px 8px;font-weight:800;font-size:16px;">Total</td>
          <td style="padding:10px 8px;text-align:right;font-weight:800;font-size:16px;">${euros(pedido.total)}</td>
        </tr>
      </tbody>
    </table>
    <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;margin-top:18px;font-size:13.5px;color:#64748b;">
      <b style="color:#0f172a;">Dirección de envío</b><br>
      ${escapeHtml(pedido.cliente.direccion)}, ${escapeHtml(pedido.cliente.cp)} ${escapeHtml(pedido.cliente.ciudad)}
    </div>
    <p style="color:#94a3b8;font-size:12.5px;margin:22px 0 0;">
      Envío a toda España · Devoluciones en 14 días · Garantía legal de 3 años<br>
      ¿Dudas? Responde a este correo o escribe a atencioncliente.chargeup@gmail.com
    </p>
  </div>
</div>`;

const cargarConfig = () => {
  // Vía preferida en producción: API de Brevo (HTTP), porque Render
  // bloquea los puertos SMTP en el plan gratuito.
  if (process.env.BREVO_API_KEY && process.env.EMAIL_USER) {
    return {
      activo: true,
      brevoKey: process.env.BREVO_API_KEY,
      user: process.env.EMAIL_USER,
      from: process.env.EMAIL_FROM ?? `ChargeUp <${process.env.EMAIL_USER}>`,
      avisos: process.env.EMAIL_AVISOS ?? process.env.EMAIL_USER,
    };
  }
  // Vía SMTP clásica (funciona en local y en hostings sin bloqueo).
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return {
      activo: true,
      host: process.env.EMAIL_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT ?? 465),
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
      from: process.env.EMAIL_FROM ?? `ChargeUp <${process.env.EMAIL_USER}>`,
      avisos: process.env.EMAIL_AVISOS ?? process.env.EMAIL_USER,
    };
  }
  // En local se lee del archivo (que está en .gitignore).
  if (!existsSync(RUTA_CONFIG)) return null;
  try {
    return JSON.parse(readFileSync(RUTA_CONFIG, 'utf-8'));
  } catch {
    return null;
  }
};

const crearTransporte = (config) =>
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

// Envía un correo por la vía disponible: API de Brevo o SMTP.
const enviarCorreo = async (config, { to, subject, html }) => {
  if (config.brevoKey) {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': config.brevoKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'ChargeUp', email: config.user },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(10000),
    });
    // No se refleja el cuerpo de la respuesta de Brevo en el error: puede
    // contener el email del destinatario y acabaría en los logs.
    if (!res.ok) throw new Error(`Brevo respondió ${res.status}`);
    return;
  }
  await crearTransporte(config).sendMail({ from: config.from, to, subject, html });
};

// Guarda un correo como HTML en data/emails/ (modo desarrollo).
const guardarEnArchivo = (nombre, destinatario, asunto, html) => {
  mkdirSync(CARPETA_DEV, { recursive: true });
  const archivo = join(CARPETA_DEV, `${nombre}.html`);
  writeFileSync(archivo, `<!-- Para: ${destinatario} | Asunto: ${asunto} -->\n${html}`);
  return archivo;
};

// Prueba la conexión SMTP sin enviar nada. Para diagnosticar la
// configuración de email desde /api/email-test.
export async function probarEmail(puerto) {
  let config = cargarConfig();
  if (!config?.activo) {
    return {
      ok: false,
      motivo: 'Configuración no activa: faltan EMAIL_USER/EMAIL_PASS (o email-config.json con "activo": true)',
    };
  }
  if (puerto) config = { ...config, port: Number(puerto) };
  try {
    if (config.brevoKey) {
      const res = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'api-key': config.brevoKey },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`Brevo respondió ${res.status}`);
      const cuenta = await res.json();
      // El email de la cuenta, el remite y el destinatario de avisos son
      // configuración interna: se registran en el servidor pero NO se
      // devuelven al cliente (aunque el endpoint exija token, un token
      // robado no debe poder enumerar la infraestructura de correo).
      console.log(
        `email-test OK (Brevo): cuenta ${cuenta.email}, remite ${config.user}, ` +
          `avisos a ${config.avisos ?? '(sin configurar)'}`
      );
      return { ok: true, via: 'Brevo API', motivo: 'Clave de Brevo válida' };
    }
    await crearTransporte(config).verify();
    console.log(
      `email-test OK (SMTP): ${config.host}:${config.port} como ${config.user}, ` +
        `avisos a ${config.avisos ?? '(sin configurar)'}`
    );
    return { ok: true, via: 'SMTP', motivo: 'Conexión SMTP correcta' };
  } catch (e) {
    // El mensaje crudo (host, puerto, usuario, o el cuerpo de respuesta del
    // proveedor —que puede incluir direcciones de correo—) se queda en el
    // log del servidor; al cliente solo le llega un motivo genérico.
    console.error(
      `email-test FALLÓ (${config.host ?? 'Brevo'}:${config.port ?? ''} como ` +
        `${config.user}): ${e.message}`
    );
    return { ok: false, motivo: 'No se pudo verificar la configuración de correo. Revisa los logs del servidor.' };
  }
}

// Envía la confirmación al cliente. Si el envío real no está activado
// en email-config.json, guarda el correo como HTML en data/emails/
// para poder revisarlo durante el desarrollo.
export async function enviarConfirmacion(pedido) {
  const html = plantilla(pedido);
  const asunto = `Confirmación de tu pedido ${pedido.id} — ChargeUp`;
  const config = cargarConfig();

  if (config?.activo) {
    await enviarCorreo(config, { to: pedido.cliente.email, subject: asunto, html });
    return { enviado: true, destino: pedido.cliente.email };
  }

  const archivo = guardarEnArchivo(pedido.id, pedido.cliente.email, asunto, html);
  return { enviado: false, archivo };
}

// Aviso de nueva venta para el dueño de la tienda (campo "avisos" de la
// configuración o variable de entorno EMAIL_AVISOS).
export async function enviarAvisoVenta(pedido) {
  const config = cargarConfig();
  const destino = config?.avisos;
  const asunto = `💰 Nueva venta ${pedido.id} — ${euros(pedido.total)}`;
  const html = `
<div style="max-width:520px;margin:0 auto;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
  <h1 style="font-size:19px;">💰 ¡Nueva venta en ChargeUp!</h1>
  <p style="font-size:14px;color:#64748b;">
    Pedido <b style="color:#2563eb;">${pedido.id}</b> ·
    ${new Date(pedido.fecha).toLocaleString('es-ES')} ·
    Total <b style="color:#0f172a;">${euros(pedido.total)}</b>
  </p>
  <ul style="font-size:14px;padding-left:18px;">
    ${pedido.lineas.map((l) => `<li>${l.qty} × ${escapeHtml(l.nombre)} — ${euros(l.subtotal)}</li>`).join('')}
  </ul>
  <p style="font-size:13.5px;color:#64748b;">
    <b style="color:#0f172a;">Cliente:</b> ${escapeHtml(pedido.cliente.nombre)} · ${escapeHtml(pedido.cliente.email)}
    ${pedido.cliente.telefono ? `· ${escapeHtml(pedido.cliente.telefono)}` : ''}<br>
    <b style="color:#0f172a;">Envío:</b> ${escapeHtml(pedido.cliente.direccion)}, ${escapeHtml(pedido.cliente.cp)} ${escapeHtml(pedido.cliente.ciudad)}
  </p>
</div>`;

  if (config?.activo && destino) {
    await enviarCorreo(config, { to: destino, subject: asunto, html });
    return { enviado: true, destino };
  }

  const archivo = guardarEnArchivo(`AVISO-${pedido.id}`, destino ?? 'sin configurar', asunto, html);
  return { enviado: false, archivo };
}

// Acuse de recibo de una solicitud de desistimiento en línea, con fecha y
// hora (soporte duradero, exigido por la Directiva UE 2023/2673). Envía la
// confirmación al cliente y un aviso al dueño. Devuelve la fecha registrada.
export async function enviarAcuseDesistimiento({ pedidoId, email, motivo }) {
  const config = cargarConfig();
  const fecha = new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
  const asunto = `Acuse de recibo de tu desistimiento — pedido ${pedidoId}`;
  const html = `
<div style="max-width:560px;margin:0 auto;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
  <h1 style="font-size:20px;">Hemos recibido tu solicitud de desistimiento</h1>
  <p style="font-size:14px;color:#64748b;">
    Confirmamos la recepción de tu solicitud de desistimiento del pedido
    <b style="color:#2563eb;">${escapeHtml(pedidoId)}</b>.
  </p>
  <p style="font-size:14px;"><b>Fecha y hora de recepción:</b> ${escapeHtml(fecha)}</p>
  ${motivo ? `<p style="font-size:14px;"><b>Motivo indicado:</b> ${escapeHtml(motivo)}</p>` : ''}
  <p style="font-size:13.5px;color:#64748b;">
    Te responderemos con las instrucciones y la dirección de devolución. El
    reembolso se efectuará por el mismo medio de pago en un máximo de 14 días,
    conforme a nuestra Política de Desistimiento y Devoluciones.
  </p>
</div>`;

  if (config?.activo) {
    await enviarCorreo(config, { to: email, subject: asunto, html });
    if (config.avisos) {
      await enviarCorreo(config, {
        to: config.avisos,
        subject: `⚠️ Desistimiento del pedido ${pedidoId}`,
        html: `${html}<p style="font-size:13px;">Cliente: ${escapeHtml(email)}</p>`,
      });
    }
  } else {
    guardarEnArchivo(`DESISTIMIENTO-${pedidoId}`, email, asunto, html);
  }
  return { fecha };
}

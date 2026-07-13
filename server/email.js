import nodemailer from 'nodemailer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
    <h1 style="font-size:21px;margin:0 0 8px;">¡Gracias por tu pedido, ${pedido.cliente.nombre}!</h1>
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
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;">${l.nombre}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:center;">${l.qty}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #f1f5f9;text-align:right;">${euros(l.subtotal)}</td>
        </tr>`
          )
          .join('')}
        <tr>
          <td colspan="2" style="padding:10px 8px;color:#64748b;">Envío</td>
          <td style="padding:10px 8px;text-align:right;">${pedido.envio === 0 ? 'Gratis' : euros(pedido.envio)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 8px;font-weight:800;font-size:16px;">Total</td>
          <td style="padding:10px 8px;text-align:right;font-weight:800;font-size:16px;">${euros(pedido.total)}</td>
        </tr>
      </tbody>
    </table>
    <div style="background:#f8fafc;border-radius:10px;padding:14px 18px;margin-top:18px;font-size:13.5px;color:#64748b;">
      <b style="color:#0f172a;">Dirección de envío</b><br>
      ${pedido.cliente.direccion}, ${pedido.cliente.cp} ${pedido.cliente.ciudad}
    </div>
    <p style="color:#94a3b8;font-size:12.5px;margin:22px 0 0;">
      Envío en 24/48h · Devoluciones en 30 días · Garantía de 2 años<br>
      ¿Dudas? Responde a este correo o escribe a hola@chargeup.es
    </p>
  </div>
</div>`;

const cargarConfig = () => {
  if (!existsSync(RUTA_CONFIG)) return null;
  try {
    return JSON.parse(readFileSync(RUTA_CONFIG, 'utf-8'));
  } catch {
    return null;
  }
};

// Envía la confirmación al cliente. Si el envío real no está activado
// en email-config.json, guarda el correo como HTML en data/emails/
// para poder revisarlo durante el desarrollo.
export async function enviarConfirmacion(pedido) {
  const html = plantilla(pedido);
  const asunto = `Confirmación de tu pedido ${pedido.id} — ChargeUp`;
  const config = cargarConfig();

  if (config?.activo) {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
    });
    await transporter.sendMail({
      from: config.from,
      to: pedido.cliente.email,
      subject: asunto,
      html,
    });
    return { enviado: true, destino: pedido.cliente.email };
  }

  mkdirSync(CARPETA_DEV, { recursive: true });
  const archivo = join(CARPETA_DEV, `${pedido.id}.html`);
  writeFileSync(archivo, `<!-- Para: ${pedido.cliente.email} | Asunto: ${asunto} -->\n${html}`);
  return { enviado: false, archivo };
}

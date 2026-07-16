import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { escapeHtml } from './escape.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Bot de Telegram para avisos de venta. El token y el chat se leen de
// las variables de entorno TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID, o de
// data/telegram-config.json (gitignored: el token es una credencial).
const rutaConfig = join(__dirname, 'data', 'telegram-config.json');
const configLocal = existsSync(rutaConfig)
  ? JSON.parse(readFileSync(rutaConfig, 'utf-8'))
  : {};
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? configLocal.botToken ?? null;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? configLocal.chatId ?? null;

const euros = (n) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

// Notificación instantánea al móvil (Telegram) con cada venta.
export async function notificarVenta(pedido) {
  if (!BOT_TOKEN || !CHAT_ID) {
    return { enviado: false, motivo: 'bot de Telegram no configurado' };
  }
  // El aviso NO incluye datos personales del cliente (nombre, ciudad, CP):
  // Telegram está fuera de la UE y no debemos transferirle datos personales.
  // Los datos completos del pedido quedan en el panel de administración.
  // Los nombres de producto se escapan porque un '<' rompería el parse HTML.
  const lineas = pedido.lineas
    .map((l) => `• ${l.qty}× ${escapeHtml(l.nombre)} — ${euros(l.subtotal)}`)
    .join('\n');
  const texto = [
    `💰 <b>Nueva venta ${escapeHtml(pedido.id)}</b>`,
    '',
    lineas,
    `Envío: ${pedido.envio === 0 ? 'gratis' : euros(pedido.envio)}`,
    `<b>Total: ${euros(pedido.total)}</b>`,
    '',
    'Datos de envío del cliente en el panel de pedidos.',
  ].join('\n');

  await enviarTelegram(texto);
  return { enviado: true };
}

// Envío base a Telegram. Lanza si la API responde con error. Corta a los
// 10s para que un upstream colgado no deje la promesa y el socket vivos.
async function enviarTelegram(texto) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: texto, parse_mode: 'HTML' }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram respondió: ${data.description ?? res.status}`);
  }
}

// Aviso de error al móvil, reutilizando el mismo bot. No hace nada si el
// bot no está configurado y se autolimita a un mensaje por minuto para
// no convertir un fallo repetido en una lluvia de notificaciones.
let ultimoAvisoError = 0;
export async function notificarError(contexto, err) {
  if (!BOT_TOKEN || !CHAT_ID) return { enviado: false, motivo: 'bot no configurado' };
  const ahora = Date.now();
  if (ahora - ultimoAvisoError < 60 * 1000) {
    return { enviado: false, motivo: 'limitado a 1 aviso/min' };
  }
  ultimoAvisoError = ahora;
  const mensaje = err?.message ?? String(err);
  const texto = [
    '⚠️ <b>Error en ChargeUp</b>',
    escapeHtml(contexto),
    escapeHtml(mensaje),
  ].join('\n');
  await enviarTelegram(texto);
  return { enviado: true };
}

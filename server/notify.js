import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
  const lineas = pedido.lineas
    .map((l) => `• ${l.qty}× ${l.nombre} — ${euros(l.subtotal)}`)
    .join('\n');
  const texto = [
    `💰 <b>Nueva venta ${pedido.id}</b>`,
    '',
    lineas,
    `Envío: ${pedido.envio === 0 ? 'gratis' : euros(pedido.envio)}`,
    `<b>Total: ${euros(pedido.total)}</b>`,
    '',
    `👤 ${pedido.cliente.nombre} · ${pedido.cliente.ciudad} (${pedido.cliente.cp})`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: texto, parse_mode: 'HTML' }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram respondió: ${data.description ?? res.status}`);
  }
  return { enviado: true };
}

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Canal de ntfy.sh para avisos de venta en el móvil. Se lee de la
// variable de entorno NTFY_TOPIC o de data/ntfy-config.json
// (gitignored: el nombre del canal funciona como contraseña).
const rutaConfig = join(__dirname, 'data', 'ntfy-config.json');
const NTFY_TOPIC =
  process.env.NTFY_TOPIC ??
  (existsSync(rutaConfig)
    ? JSON.parse(readFileSync(rutaConfig, 'utf-8')).topic
    : null);

const euros = (n) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

// Notificación push instantánea al móvil con cada venta.
// Contenido mínimo a propósito: sin nombre ni dirección del cliente.
export async function notificarVenta(pedido) {
  if (!NTFY_TOPIC) {
    return { enviado: false, motivo: 'canal ntfy no configurado' };
  }
  const resumen = pedido.lineas.map((l) => `${l.qty}× ${l.nombre}`).join(', ');
  const res = await fetch('https://ntfy.sh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic: NTFY_TOPIC,
      title: `Nueva venta ${pedido.id} — ${euros(pedido.total)}`,
      message: `${resumen}\nEnvío a ${pedido.cliente.ciudad} (${pedido.cliente.cp})`,
      priority: 4,
      tags: ['moneybag'],
    }),
  });
  if (!res.ok) {
    throw new Error(`ntfy respondió ${res.status}`);
  }
  return { enviado: true };
}

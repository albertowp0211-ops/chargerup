// Genera imágenes de producto (SVG) a partir de server/data/products.json
// y añade el campo `imagenes` a cada producto. Son PLACEHOLDERS a partir de
// los datos reales (emoji + características + garantías); reemplázalas por
// fotos reales dejando los archivos en client/public/img/ y actualizando el
// array `imagenes` de cada producto.
//   node scripts/generar-imagenes.mjs   (desde la carpeta client)

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rutaProductos = join(__dirname, '..', '..', 'server', 'data', 'products.json');
const carpetaImg = join(__dirname, '..', 'public', 'img');
mkdirSync(carpetaImg, { recursive: true });

const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const corta = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

// Un tono de acento por producto para que las fichas no sean todas iguales
const acentos = ['#2563eb', '#0ea5e9', '#7c3aed', '#059669', '#f59e0b', '#e11d48', '#0891b2', '#4f46e5'];

// Imagen 1 — principal: emoji grande sobre degradado de marca
const heroSvg = (p, acento) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${esc(p.nombre)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#eaf1ff"/><stop offset="1" stop-color="#f8fafc"/>
    </linearGradient>
    <radialGradient id="halo" cx="50%" cy="42%" r="42%">
      <stop offset="0" stop-color="${acento}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${acento}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect width="800" height="800" fill="url(#halo)"/>
  <text x="400" y="400" font-size="360" text-anchor="middle" dominant-baseline="central">${esc(p.imagen)}</text>
  <text x="400" y="700" font-size="34" font-weight="700" text-anchor="middle" fill="#0f172a" font-family="Segoe UI, Arial, sans-serif">${esc(corta(p.nombre, 34))}</text>
</svg>`;

// Imagen 2 — características: infografía con los puntos clave
const specsSvg = (p, acento) => {
  const items = (p.caracteristicas ?? []).slice(0, 4);
  const filas = items
    .map(
      (c, i) => `
    <circle cx="90" cy="${318 + i * 92}" r="7" fill="${acento}"/>
    <text x="120" y="${318 + i * 92}" font-size="30" fill="#334155" dominant-baseline="central" font-family="Segoe UI, Arial, sans-serif">${esc(corta(c, 42))}</text>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="Características de ${esc(p.nombre)}">
  <rect width="800" height="800" fill="#ffffff"/>
  <rect x="0" y="0" width="800" height="200" fill="#f1f5f9"/>
  <text x="60" y="115" font-size="88" dominant-baseline="central">${esc(p.imagen)}</text>
  <text x="180" y="100" font-size="34" font-weight="800" fill="#0f172a" dominant-baseline="central" font-family="Segoe UI, Arial, sans-serif">Características</text>
  <text x="180" y="140" font-size="24" fill="#64748b" dominant-baseline="central" font-family="Segoe UI, Arial, sans-serif">${esc(corta(p.nombre, 40))}</text>
  ${filas}
</svg>`;
};

// Imagen 3 — confianza: garantías y ventajas
const trustSvg = (p, acento) => {
  const badges = ['🛡️ Garantía legal de 3 años', '🚚 Envío desde España', '🔒 Pago seguro con Stripe', '↩️ 14 días para devolver'];
  const filas = badges
    .map(
      (b, i) => `<text x="400" y="${360 + i * 78}" font-size="30" text-anchor="middle" fill="#0f172a" dominant-baseline="central" font-family="Segoe UI, Arial, sans-serif">${esc(b)}</text>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="Garantías de ${esc(p.nombre)}">
  <defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient></defs>
  <rect width="800" height="800" fill="url(#d)"/>
  <text x="400" y="150" font-size="150" text-anchor="middle" dominant-baseline="central">${esc(p.imagen)}</text>
  <rect x="150" y="245" width="500" height="1" fill="#334155"/>
  <g>${filas.replaceAll('fill="#0f172a"', 'fill="#e2e8f0"')}</g>
</svg>`;
};

const productos = JSON.parse(readFileSync(rutaProductos, 'utf-8'));
let generadas = 0;
for (const p of productos) {
  const acento = acentos[(p.id - 1) % acentos.length];
  const svgs = [heroSvg(p, acento), specsSvg(p, acento), trustSvg(p, acento)];
  const rutas = [];
  svgs.forEach((svg, i) => {
    const nombre = `prod-${p.id}-${i + 1}.svg`;
    writeFileSync(join(carpetaImg, nombre), svg, 'utf-8');
    rutas.push(`/img/${nombre}`);
    generadas++;
  });
  p.imagenes = rutas;
}

writeFileSync(rutaProductos, JSON.stringify(productos, null, 2) + '\n', 'utf-8');
console.log(`Generadas ${generadas} imágenes para ${productos.length} productos en client/public/img/`);
console.log('Campo "imagenes" añadido a products.json.');

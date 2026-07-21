// Genera client/public/sitemap.xml a partir del catálogo de server/data/products.json.
// Sin dependencias. Uso: npm run sitemap (o node scripts/generar-sitemap.mjs).
// La URL base se puede cambiar con la variable de entorno TIENDA_URL.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const BASE = (process.env.TIENDA_URL || 'https://chargerup-buse.vercel.app').replace(/\/$/, '');

const productos = JSON.parse(
  readFileSync(join(aqui, '..', '..', 'server', 'data', 'products.json'), 'utf8')
);

// Rutas públicas indexables: portada, fichas de producto y páginas legales
// (slugs del mapa PAGINAS de client/src/pages/LegalPage.jsx)
const rutas = [
  '/',
  ...productos.map((p) => `/producto/${p.id}`),
  '/legal/aviso-legal',
  '/legal/privacidad',
  '/legal/cookies',
  '/legal/condiciones',
  '/legal/desistimiento',
  '/legal/envios-devoluciones',
];

const hoy = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rutas
  .map(
    (ruta) => `  <url>
    <loc>${BASE}${ruta === '/' ? '/' : ruta}</loc>
    <lastmod>${hoy}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const destino = join(aqui, '..', 'public', 'sitemap.xml');
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, xml);
console.log(`Sitemap generado con ${rutas.length} URLs en ${destino}`);

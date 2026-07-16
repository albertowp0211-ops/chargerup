// Códigos promocionales de la tienda. Se definen en data/promos.json
// (editable sin reiniciar: mismo patrón de caché + fs.watch que el
// catálogo). OJO: el repositorio es público, así que los códigos del
// archivo son visibles — son códigos para repartir, no secretos. Un
// código desactivado se conserva con "activo": false para poder
// reactivarlo más adelante.
import { readFileSync, watch } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rutaPromos = join(__dirname, 'data', 'promos.json');

let cachePromos = null;
const cargarPromos = () => {
  if (cachePromos === null) {
    try {
      cachePromos = JSON.parse(readFileSync(rutaPromos, 'utf-8'));
    } catch {
      // Sin archivo o JSON roto: ningún código válido, la tienda sigue.
      cachePromos = {};
    }
  }
  return cachePromos;
};
try {
  const vigilante = watch(rutaPromos, () => {
    cachePromos = null;
  });
  vigilante.on('error', () => {
    cachePromos = null;
  });
} catch {
  // Sin watch, cargarPromos relee bajo demanda tras un error.
}

// Valida un código contra la tabla dada (inyectable para los tests).
// Devuelve { codigo, pct } o null. Insensible a mayúsculas y espacios;
// el límite de longitud corta entradas absurdas antes de buscar.
export const validarPromo = (codigo, promos = cargarPromos()) => {
  const clave = String(codigo ?? '').trim().toUpperCase();
  if (!clave || clave.length > 40) return null;
  const promo = promos[clave];
  if (!promo || promo.activo === false) return null;
  const pct = Number(promo.pct);
  if (!Number.isFinite(pct) || pct <= 0 || pct > 90) return null;
  return { codigo: clave, pct };
};

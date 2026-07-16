import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarPromo } from '../promos.js';

// Tabla de códigos inyectada: los tests no dependen de data/promos.json
const PROMOS = {
  BIENVENIDA10: { pct: 10, activo: true },
  CADUCADO5: { pct: 5, activo: false },
  ROTO: { pct: 'mucho', activo: true },
  EXCESIVO: { pct: 95, activo: true },
};

test('acepta un código activo y devuelve su porcentaje', () => {
  assert.deepEqual(validarPromo('BIENVENIDA10', PROMOS), {
    codigo: 'BIENVENIDA10',
    pct: 10,
  });
});

test('normaliza mayúsculas y espacios', () => {
  assert.deepEqual(validarPromo('  bienvenida10 ', PROMOS), {
    codigo: 'BIENVENIDA10',
    pct: 10,
  });
});

test('rechaza un código que no existe', () => {
  assert.equal(validarPromo('NOEXISTE', PROMOS), null);
});

test('rechaza un código desactivado', () => {
  assert.equal(validarPromo('CADUCADO5', PROMOS), null);
});

test('rechaza un código vacío o nulo', () => {
  assert.equal(validarPromo('', PROMOS), null);
  assert.equal(validarPromo('   ', PROMOS), null);
  assert.equal(validarPromo(null, PROMOS), null);
  assert.equal(validarPromo(undefined, PROMOS), null);
});

test('rechaza un código más largo de 40 caracteres', () => {
  assert.equal(validarPromo('X'.repeat(41), PROMOS), null);
});

test('rechaza porcentajes no numéricos o fuera de rango (0 < pct <= 90)', () => {
  assert.equal(validarPromo('ROTO', PROMOS), null);
  assert.equal(validarPromo('EXCESIVO', PROMOS), null);
});

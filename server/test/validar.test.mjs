// Tests de validarPedido: cubren la lógica que toca dinero sin arrancar
// el servidor ni tocar la base de datos.
//   node --test test/    (o npm test desde la carpeta server)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarPedido } from '../validar.js';

// Catálogo de prueba: un producto barato (para el umbral de envío) y
// uno caro (para superarlo con una sola unidad).
const CATALOGO = [
  { id: 1, nombre: 'Cable USB-C', precio: 9.99 },
  { id: 2, nombre: 'Cargador 65W', precio: 27.99 },
];

const CLIENTE_OK = {
  nombre: 'Ada Lovelace',
  email: 'ada@example.com',
  telefono: '600123123',
  direccion: 'Calle Mayor 1',
  ciudad: 'Madrid',
  cp: '28001',
};

test('rechaza cuando faltan campos obligatorios', () => {
  const r = validarPedido({ nombre: 'Solo nombre' }, [{ id: 1, qty: 1 }], CATALOGO);
  assert.match(r.error, /Faltan datos/);
});

test('rechaza el carrito vacío', () => {
  const r = validarPedido(CLIENTE_OK, [], CATALOGO);
  assert.match(r.error, /vacío/);
});

test('rechaza un producto que no existe en el catálogo', () => {
  const r = validarPedido(CLIENTE_OK, [{ id: 999, qty: 1 }], CATALOGO);
  assert.match(r.error, /no válidos/);
});

test('rechaza un producto marcado como no disponible (agotado)', () => {
  const catalogo = [{ id: 1, nombre: 'Agotado', precio: 9.99, disponible: false }];
  const r = validarPedido(CLIENTE_OK, [{ id: 1, qty: 1 }], catalogo);
  assert.match(r.error, /agotado/);
});

test('rechaza cantidad 0', () => {
  const r = validarPedido(CLIENTE_OK, [{ id: 1, qty: 0 }], CATALOGO);
  assert.match(r.error, /no válidos/);
});

test('rechaza cantidad 100 (supera el máximo de 99)', () => {
  const r = validarPedido(CLIENTE_OK, [{ id: 1, qty: 100 }], CATALOGO);
  assert.match(r.error, /no válidos/);
});

test('rechaza cantidad decimal 1.5', () => {
  const r = validarPedido(CLIENTE_OK, [{ id: 1, qty: 1.5 }], CATALOGO);
  assert.match(r.error, /no válidos/);
});

test('acepta cantidad como string numérico "3"', () => {
  const r = validarPedido(CLIENTE_OK, [{ id: 1, qty: '3' }], CATALOGO);
  assert.equal(r.error, undefined);
  assert.equal(r.lineas[0].qty, 3);
});

test('rechaza un campo que supera la longitud máxima', () => {
  const cliente = { ...CLIENTE_OK, nombre: 'A'.repeat(81) };
  const r = validarPedido(cliente, [{ id: 1, qty: 1 }], CATALOGO);
  assert.match(r.error, /demasiado largo/);
});

test('rechaza un email mal formado', () => {
  const cliente = { ...CLIENTE_OK, email: 'no-es-un-email' };
  const r = validarPedido(cliente, [{ id: 1, qty: 1 }], CATALOGO);
  assert.match(r.error, /email no es válido/);
});

test('rechaza un email con coma (varios destinatarios)', () => {
  const cliente = { ...CLIENTE_OK, email: 'victima@x.com,atacante@evil.com' };
  const r = validarPedido(cliente, [{ id: 1, qty: 1 }], CATALOGO);
  assert.match(r.error, /email no es válido/);
});

test('rechaza un código postal que no tiene 5 dígitos', () => {
  const cliente = { ...CLIENTE_OK, cp: '123' };
  const r = validarPedido(cliente, [{ id: 1, qty: 1 }], CATALOGO);
  assert.match(r.error, /código postal/);
});

test('cobra envío cuando el subtotal es 29,99 (por debajo del umbral)', () => {
  // Forzamos el subtotal justo por debajo del umbral con un producto artificial.
  const catalogo = [{ id: 3, nombre: 'Artículo', precio: 29.99 }];
  const r = validarPedido(CLIENTE_OK, [{ id: 3, qty: 1 }], catalogo);
  assert.equal(r.subtotal, 29.99);
  assert.equal(r.envio, 4.99);
  assert.equal(r.total, 34.98);
});

test('envío gratis cuando el subtotal alcanza justo 30,00', () => {
  const catalogo = [{ id: 3, nombre: 'Artículo', precio: 30 }];
  const r = validarPedido(CLIENTE_OK, [{ id: 3, qty: 1 }], catalogo);
  assert.equal(r.subtotal, 30);
  assert.equal(r.envio, 0);
  assert.equal(r.total, 30);
});

test('rechaza más de 30 productos distintos', () => {
  const catalogo = Array.from({ length: 31 }, (_, i) => ({
    id: i + 1,
    nombre: `P${i + 1}`,
    precio: 1,
  }));
  const items = catalogo.map((p) => ({ id: p.id, qty: 1 }));
  const r = validarPedido(CLIENTE_OK, items, catalogo);
  assert.match(r.error, /demasiados productos/);
});

test('calcula bien las líneas y los subtotales de un pedido válido', () => {
  const r = validarPedido(CLIENTE_OK, [{ id: 2, qty: 2 }], CATALOGO);
  assert.equal(r.error, undefined);
  assert.equal(r.lineas.length, 1);
  assert.equal(r.lineas[0].subtotal, 55.98);
  assert.equal(r.subtotal, 55.98);
  assert.equal(r.envio, 0);
  assert.equal(r.total, 55.98);
});

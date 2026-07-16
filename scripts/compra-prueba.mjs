// Compra de prueba de extremo a extremo contra la tienda en producción.
// Crea una sesión de pago y la paga con la tarjeta de test de Stripe
// usando un navegador automatizado. Solo funciona en modo test.
//
// Uso:  node scripts/compra-prueba.mjs   (desde la carpeta chargeup)

import { chromium } from 'playwright';

const TIENDA = process.env.TIENDA_URL ?? 'https://chargerup-buse.vercel.app';

console.log('1. Creando la sesión de pago en la tienda…');
// Coge el primer producto real del catálogo en vez de un id fijo, para
// que la prueba no dependa de que exista el producto 5.
const catalogo = await (await fetch(`${TIENDA}/api/products`)).json();
const primerId = catalogo[0]?.id;
if (!primerId) throw new Error('El catálogo está vacío: no hay ningún producto que comprar');

const res = await fetch(`${TIENDA}/api/checkout`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: TIENDA },
  body: JSON.stringify({
    cliente: {
      nombre: 'Compra Automática E2E',
      email: 'albertowp0211@gmail.com',
      telefono: '600000000',
      direccion: 'Calle Robot 1',
      ciudad: 'Barcelona',
      cp: '08001',
    },
    items: [{ id: primerId, qty: 1 }],
  }),
});
const { url, error } = await res.json();
if (!url) throw new Error(`No se pudo crear la sesión: ${error}`);
if (!url.includes('cs_test_')) throw new Error('La sesión NO es de test — abortando por seguridad');

console.log('2. Abriendo la página de pago de Stripe…');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 60000 });

console.log('3. Seleccionando el método "Tarjeta"…');
const radioTarjeta = page.locator('#payment-method-accordion-item-title-card');
await radioTarjeta.waitFor({ timeout: 30000 });
await radioTarjeta.check({ force: true });

console.log('4. Rellenando la tarjeta de prueba 4242…');
await page.fill('input[name="cardNumber"]', '4242 4242 4242 4242', { timeout: 30000 });
await page.fill('input[name="cardExpiry"]', '12 / 30');
await page.fill('input[name="cardCvc"]', '123');
await page.fill('input[name="billingName"]', 'Compra Automática E2E');

const pais = page.locator('select[name="billingCountry"]');
if (await pais.count()) await pais.selectOption('ES');
const postal = page.locator('input[name="billingPostalCode"]');
if (await postal.count()) await postal.fill('08001');

console.log('5. Pagando…');
await page.click('button[type="submit"]');

console.log('6. Esperando la vuelta a la tienda…');
await page.waitForURL('**/pedido/exito**', { timeout: 90000 });
await page.waitForTimeout(4000);
const texto = await page.textContent('body');
const idPedido = texto.match(/CU-[A-Z0-9-]+/)?.[0];

// Normalizamos ambos lados para que la comparación no falle por acentos
// codificados de forma distinta (NFC vs NFD).
if (texto.normalize().includes('Pago completado'.normalize())) {
  console.log(`✅ Compra completada. Pedido: ${idPedido ?? '(id no visible)'}`);
} else {
  console.log(`⚠️ Volvimos a la tienda pero sin confirmación clara. Pedido detectado: ${idPedido ?? 'ninguno'}`);
  console.log(texto.slice(0, 400));
}

await browser.close();

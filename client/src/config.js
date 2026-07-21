// Configuración compartida de la tienda.

// ===== Marca =====
// El nombre NO es definitivo: cámbialo aquí y se actualiza en toda la web
// (navbar, footer, hero, títulos de página, páginas legales…).
// Recuerda actualizar también los archivos estáticos al renombrar:
// client/index.html (título y Open Graph), vite.config.js (manifest PWA)
// y los correos del servidor (server/email.js / variable MARCA).
export const MARCA = 'ChargeUp';

// Dominio público y correo de contacto (sin @ delante en EMAIL_CONTACTO no,
// va completo). Cámbialos cuando tengas el dominio y el buzón definitivos.
export const DOMINIO = 'chargerup-buse.vercel.app';
export const EMAIL_CONTACTO = 'atencioncliente.chargeup@gmail.com';

// Teléfono de atención al cliente. TELEFONO_CONTACTO son solo los dígitos
// nacionales (para mostrar); TELEFONO_TEL lleva el prefijo internacional
// para los enlaces tel: (así funciona al pulsarlo desde el móvil).
export const TELEFONO_CONTACTO = '643 06 60 84';
export const TELEFONO_TEL = '+34643066084';
// Enlace de WhatsApp (wa.me usa el número internacional sin el signo +)
export const WHATSAPP_URL = `https://wa.me/${TELEFONO_TEL.replace('+', '')}`;

// ===== Datos legales del titular =====
// OBLIGATORIO rellenar con los datos REALES antes de vender: la LSSI y el
// RGPD exigen identificar al titular. Mientras estén vacíos, las páginas
// legales mostrarán un aviso de "pendiente de completar".
export const EMPRESA = {
  razonSocial: '', // Nombre y apellidos (autónomo) o razón social (S.L.)
  nif: '',         // NIF / CIF
  domicilio: '',   // Domicilio completo (calle, nº, CP, localidad, provincia)
  telefono: TELEFONO_CONTACTO, // Teléfono de atención (recomendado)
};

// Sustituye los tokens {{MARCA}}, {{EMAIL}}, {{RAZON_SOCIAL}}… de las
// plantillas legales por los valores reales de la configuración. Los datos
// aún sin rellenar se marcan de forma visible para no publicarlos vacíos.
export const rellenarTokens = (texto) => {
  const pendiente = (v, etiqueta) =>
    v && String(v).trim() ? String(v) : `[PENDIENTE: ${etiqueta}]`;
  return String(texto)
    .replaceAll('{{MARCA}}', MARCA)
    .replaceAll('{{DOMINIO}}', DOMINIO)
    .replaceAll('{{EMAIL}}', EMAIL_CONTACTO)
    .replaceAll('{{RAZON_SOCIAL}}', pendiente(EMPRESA.razonSocial, 'razón social / nombre'))
    .replaceAll('{{NIF}}', pendiente(EMPRESA.nif, 'NIF/CIF'))
    .replaceAll('{{DOMICILIO}}', pendiente(EMPRESA.domicilio, 'domicilio'))
    .replaceAll('{{TELEFONO}}', pendiente(EMPRESA.telefono, 'teléfono'));
};

// ===== Envío =====
// OJO: el umbral vive también en server/validar.js (el servidor es quien
// cobra de verdad el envío); si cambias uno, cambia el otro.
export const ENVIO_GRATIS_DESDE = 30;
export const COSTE_ENVIO = 4.99;
export const PLAZO_ENTREGA = '24/48 horas';

// Coste de envío que corresponde a un subtotal dado
export const envioPara = (subtotal) =>
  subtotal >= ENVIO_GRATIS_DESDE ? 0 : COSTE_ENVIO;

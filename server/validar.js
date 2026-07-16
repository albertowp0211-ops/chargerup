// Validación de pedidos, extraída de index.js para poder probarla
// sin arrancar el servidor ni tocar la base de datos.

// Longitud máxima por campo del cliente: evita desbordar los emails,
// la metadata de Stripe y la base de datos.
const LONGITUD_MAX = {
  nombre: 80,
  email: 120,
  telefono: 30,
  direccion: 160,
  ciudad: 80,
};

// Máximo de productos distintos por pedido.
const ITEMS_MAX = 30;

// Una sola dirección: sin espacios (bloquea inyección de cabeceras CRLF)
// y sin comas ni varios '@' (evita colar múltiples destinatarios en el
// envío SMTP de nodemailer).
const REGEX_EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
const REGEX_CP = /^\d{5}$/;

// Valida cliente e items y calcula las líneas con los precios del
// catálogo, para que el cliente no pueda manipularlos.
// Devuelve { error } o { lineas, subtotal, envio, total }.
export const validarPedido = (cliente = {}, items = [], catalogo = []) => {
  const obligatorios = ['nombre', 'email', 'direccion', 'ciudad', 'cp'];
  const faltan = obligatorios.filter((c) => !String(cliente[c] ?? '').trim());
  if (faltan.length > 0) return { error: `Faltan datos: ${faltan.join(', ')}` };

  for (const [campo, max] of Object.entries(LONGITUD_MAX)) {
    if (String(cliente[campo] ?? '').trim().length > max) {
      return { error: `El campo ${campo} es demasiado largo (máximo ${max} caracteres)` };
    }
  }
  if (!REGEX_EMAIL.test(String(cliente.email).trim())) {
    return { error: 'El email no es válido' };
  }
  if (!REGEX_CP.test(String(cliente.cp).trim())) {
    return { error: 'El código postal debe tener 5 dígitos' };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'El carrito está vacío' };
  }
  if (items.length > ITEMS_MAX) {
    return { error: `El carrito tiene demasiados productos distintos (máximo ${ITEMS_MAX})` };
  }

  const lineas = [];
  for (const { id, qty } of items) {
    const producto = catalogo.find((p) => p.id === id);
    const cantidad = Number(qty);
    if (!producto || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
      return { error: 'Producto o cantidad no válidos' };
    }
    // Un producto marcado como no disponible no se puede comprar.
    if (producto.disponible === false) {
      return { error: `"${producto.nombre}" está agotado ahora mismo` };
    }
    lineas.push({
      id,
      nombre: producto.nombre,
      precio: producto.precio,
      qty: cantidad,
      subtotal: +(producto.precio * cantidad).toFixed(2),
    });
  }

  const subtotal = +lineas.reduce((s, l) => s + l.subtotal, 0).toFixed(2);
  const envio = subtotal >= 25 ? 0 : 4.99;
  const total = +(subtotal + envio).toFixed(2);
  return { lineas, subtotal, envio, total };
};

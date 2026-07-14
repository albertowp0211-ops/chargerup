import { Link, useParams } from 'react-router-dom';

// ⚠️ Plantillas orientativas. Antes de vender de verdad hay que
// completar los datos entre [corchetes] y revisarlas (idealmente
// con un profesional). No constituyen asesoramiento jurídico.

const PAGINAS = {
  'aviso-legal': {
    titulo: 'Aviso legal',
    secciones: [
      {
        h: 'Identificación del titular',
        p: [
          'En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que este sitio web es titularidad de:',
          '[Nombre completo o razón social] · NIF/CIF: [número] · Domicilio: [dirección completa] · Email de contacto: hola@chargeup.es · Teléfono: +34 900 123 456.',
        ],
      },
      {
        h: 'Objeto',
        p: [
          'ChargeUp es una tienda online dedicada a la venta de cargadores y accesorios de carga para dispositivos electrónicos. El acceso y uso de la web atribuye la condición de usuario e implica la aceptación de este aviso legal.',
        ],
      },
      {
        h: 'Propiedad intelectual',
        p: [
          'Los contenidos de esta web (textos, imágenes, logotipos y diseño) son titularidad de ChargeUp o de terceros que han autorizado su uso, y están protegidos por la normativa de propiedad intelectual e industrial. Queda prohibida su reproducción sin autorización expresa.',
        ],
      },
      {
        h: 'Responsabilidad',
        p: [
          'El titular no se hace responsable de los daños derivados de un uso incorrecto de la web ni de interrupciones técnicas ajenas a su control, sin perjuicio de los derechos que la normativa de consumo reconoce a los usuarios.',
        ],
      },
      {
        h: 'Legislación aplicable',
        p: [
          'Este aviso legal se rige por la legislación española. Para cualquier controversia, y salvo que la normativa de consumo disponga otra cosa, las partes se someten a los juzgados y tribunales del domicilio del consumidor.',
        ],
      },
    ],
  },
  privacidad: {
    titulo: 'Política de privacidad',
    secciones: [
      {
        h: 'Responsable del tratamiento',
        p: [
          '[Nombre completo o razón social] · NIF/CIF: [número] · Domicilio: [dirección completa] · Email: hola@chargeup.es.',
        ],
      },
      {
        h: 'Qué datos recogemos y para qué',
        p: [
          'Al realizar un pedido recogemos tu nombre, email, teléfono (opcional) y dirección de envío. Los utilizamos exclusivamente para gestionar tu compra: procesar el pedido, enviarlo, emitir la factura y comunicarnos contigo sobre su estado.',
          'La base legal del tratamiento es la ejecución del contrato de compraventa (art. 6.1.b RGPD).',
        ],
      },
      {
        h: 'Pagos',
        p: [
          'El pago se procesa a través de Stripe Payments Europe, Ltd. Los datos de tu tarjeta se introducen directamente en la plataforma segura de Stripe y nunca pasan por nuestros servidores. Puedes consultar su política en stripe.com/es/privacy.',
        ],
      },
      {
        h: 'Destinatarios y encargados',
        p: [
          'Tus datos se alojan en proveedores de infraestructura (Vercel, Render y proveedor de base de datos) que actúan como encargados del tratamiento. No vendemos ni cedemos tus datos a terceros con fines comerciales.',
        ],
      },
      {
        h: 'Conservación',
        p: [
          'Conservamos los datos de los pedidos durante los plazos exigidos por la normativa fiscal y de consumo (con carácter general, 5 años).',
        ],
      },
      {
        h: 'Tus derechos',
        p: [
          'Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a hola@chargeup.es. Si consideras que no hemos atendido correctamente tus derechos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).',
        ],
      },
      {
        h: 'Cookies y almacenamiento local',
        p: [
          'Esta web no utiliza cookies de seguimiento ni de publicidad. Únicamente empleamos el almacenamiento local del navegador para recordar el contenido de tu carrito, una función estrictamente técnica que no requiere consentimiento.',
        ],
      },
    ],
  },
  devoluciones: {
    titulo: 'Envíos y devoluciones',
    secciones: [
      {
        h: 'Envíos',
        p: [
          'Realizamos envíos a España peninsular en 24/48 horas laborables desde la confirmación del pago. El envío es gratuito en pedidos superiores a 25€; por debajo de ese importe tiene un coste de 4,99€.',
        ],
      },
      {
        h: 'Derecho de desistimiento (14 días)',
        p: [
          'Conforme a la Ley General para la Defensa de los Consumidores y Usuarios, dispones de 14 días naturales desde la recepción del pedido para desistir de la compra sin necesidad de justificación.',
          'Para ejercerlo, escríbenos a hola@chargeup.es indicando tu número de pedido. Te reembolsaremos el importe total (incluidos los gastos de envío ordinarios) en un plazo máximo de 14 días desde que recibamos el producto, por el mismo medio de pago.',
        ],
      },
      {
        h: 'Nuestra política ampliada (30 días)',
        p: [
          'Además del plazo legal, en ChargeUp aceptamos devoluciones hasta 30 días naturales desde la recepción, siempre que el producto esté en buen estado y con su embalaje original. Los gastos de devolución en este plazo ampliado corren a cargo del cliente.',
        ],
      },
      {
        h: 'Productos defectuosos y garantía',
        p: [
          'Todos nuestros productos tienen la garantía legal de conformidad de 3 años desde la entrega. Si un producto llega dañado o presenta defectos, contacta con nosotros y gestionaremos su reparación, sustitución o reembolso sin coste alguno para ti, incluidos los gastos de envío.',
        ],
      },
    ],
  },
};

export default function LegalPage() {
  const { slug } = useParams();
  const pagina = PAGINAS[slug];

  if (!pagina) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-ico">🔍</div>
          <p>Esta página no existe.</p>
          <Link className="btn btn-primary" to="/">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page legal">
      <h1 className="page-title">{pagina.titulo}</h1>
      {pagina.secciones.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((parrafo) => (
            <p key={parrafo.slice(0, 40)}>{parrafo}</p>
          ))}
        </section>
      ))}
      <p className="legal-update">Última actualización: julio de 2026</p>
    </div>
  );
}

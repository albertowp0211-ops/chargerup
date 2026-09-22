import { COSTE_ENVIO, PLAZO_ENTREGA } from '../config.js';
import { euros } from '../context/CartContext.jsx';

const PREGUNTAS = [
  {
    q: '¿Es original de Apple de verdad?',
    a: 'Sí. Son el adaptador y el cable que Apple fabrica y vende, con su caja precintada. No son compatibles, ni réplicas, ni "calidad original". Si al recibirlo crees que no lo es, lo devuelves y te devolvemos el dinero.',
  },
  {
    q: '¿Sirve para mi iPhone?',
    a: 'El adaptador de 20 W vale para cualquier iPhone, iPad, AirPods y Apple Watch. El cable es USB-C a USB-C, así que es el de los iPhone 15 en adelante y los iPad modernos. Si tu iPhone es del 14 o anterior, su cable es Lightning: escríbenos antes de comprar y te lo decimos.',
  },
  {
    q: '¿Cuánto tarda en llegar?',
    a: `Sale de España y llega en ${PLAZO_ENTREGA} desde que confirmamos el pedido. El envío cuesta ${euros(COSTE_ENVIO)} y lo ves antes de pagar, sin sorpresas en el último paso.`,
  },
  {
    q: '¿Y si no me convence?',
    a: 'Tienes 14 días para devolverlo sin dar explicaciones, como marca la ley. Nos escribes, nos lo mandas de vuelta y te reembolsamos.',
  },
  {
    q: '¿Es seguro pagar aquí?',
    a: 'El pago lo procesa Stripe, la misma pasarela que usan miles de tiendas. Los datos de tu tarjeta van directos a Stripe: nosotros no los vemos ni los guardamos en ningún momento.',
  },
  {
    q: '¿Me dais factura?',
    a: 'Sí. Recibirás el justificante de compra por correo con el detalle del pedido. Si necesitas factura con tus datos fiscales, pídenosla y te la mandamos.',
  },
];

export default function Faq() {
  return (
    <section className="faq container" id="dudas">
      <div className="porque-head">
        <span className="eyebrow">Antes de comprar</span>
        <h2>
          Las dudas <em>de siempre</em>
        </h2>
      </div>

      <div className="faq-lista">
        {PREGUNTAS.map(({ q, a }) => (
          <details className="faq-item" key={q}>
            <summary>
              {q}
              <span className="faq-mas" aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

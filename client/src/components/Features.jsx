import { ENVIO_GRATIS_DESDE } from '../config.js';

const FEATURES = [
  { ico: '🚚', titulo: 'Envío a toda España', detalle: `Gratis a partir de ${ENVIO_GRATIS_DESDE} €` },
  { ico: '🛡️', titulo: 'Garantía legal de 3 años', detalle: 'En todos los productos' },
  { ico: '🔒', titulo: 'Pago seguro', detalle: 'Visa, Mastercard, Apple Pay' },
];

export default function Features() {
  return (
    <section className="features">
      <div className="container features-inner">
        {FEATURES.map((f) => (
          <div className="feature" key={f.titulo}>
            <span className="ico">{f.ico}</span>
            <div>
              <b>{f.titulo}</b>
              <small>{f.detalle}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

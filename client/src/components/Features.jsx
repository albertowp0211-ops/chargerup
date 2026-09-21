import { COSTE_ENVIO, PLAZO_ENTREGA } from '../config.js';

const FEATURES = [
  { ico: '🍎', titulo: 'Originales de Apple', detalle: 'Nada de réplicas ni compatibles' },
  { ico: '🔋', titulo: 'Cuidan la batería', detalle: 'Carga negociada con tu iPhone' },
  { ico: '🚚', titulo: 'Envío desde España', detalle: `${COSTE_ENVIO} € · entrega en ${PLAZO_ENTREGA}` },
  { ico: '↩️', titulo: '14 días para devolverlo', detalle: 'Sin dar explicaciones' },
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

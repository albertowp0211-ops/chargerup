const FEATURES = [
  { ico: '🚚', titulo: 'Envío 24/48h', detalle: 'Gratis desde 25€' },
  { ico: '🛡️', titulo: 'Garantía 3 años', detalle: 'En todos los productos' },
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

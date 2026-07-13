export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-text">
          <span className="pill">⚡ Nueva generación GaN — hasta 30% más eficiente</span>
          <h1>
            Carga tus dispositivos <em>a máxima velocidad</em>
          </h1>
          <p>
            Cargadores rápidos, inalámbricos y powerbanks con garantía de 2 años.
            Compatibles con iPhone, Android, tablets y portátiles.
          </p>
          <a className="btn btn-primary" href="/#catalogo">
            Ver catálogo
          </a>
          <a className="btn btn-ghost" href="/#ofertas">
            Ofertas de la semana
          </a>
        </div>
        <div className="hero-visual">🔌</div>
      </div>
    </section>
  );
}

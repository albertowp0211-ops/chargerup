export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid-lines" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-text">
          <span className="pill">100 % originales de Apple · Nada de imitaciones</span>
          <h1>
            Carga tu iPhone con el cargador <em>que diseñó Apple</em>
          </h1>
          <p>
            Un cargador genérico entrega la corriente que puede. El original negocia con
            tu iPhone cuánta potencia admite en cada momento, carga al 50 % en media hora
            y cuida la batería a largo plazo.
          </p>
          <div className="hero-cta">
            <a className="btn btn-primary" href="/#catalogo">
              Ver los tres originales
            </a>
            <a className="btn btn-ghost" href="/#por-que">
              Por qué importa
            </a>
          </div>

          <ul className="hero-specs">
            <li>
              <b>20 W</b>
              <small>Potencia real</small>
            </li>
            <li>
              <b>~30 min</b>
              <small>Hasta el 50 %</small>
            </li>
            <li>
              <b>desde 10 €</b>
              <small>Envío desde España</small>
            </li>
          </ul>
        </div>

        <div className="hero-visual">
          <div className="hero-halo" aria-hidden="true" />
          <img
            className="hero-foto"
            src="/img/apple-pack-recorte.png"
            alt="Pack original de Apple: adaptador de corriente USB-C de 20 W y cable de tela USB-C de 1 metro"
            width="520"
            height="520"
          />
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from 'react';

export default function Hero() {
  const escenaRef = useRef(null);

  // Ligero paralaje 3D siguiendo al puntero. Se desactiva si el sistema
  // pide menos movimiento o si no hay ratón (móvil), donde estorbaría.
  useEffect(() => {
    const escena = escenaRef.current;
    if (!escena) return;
    const finoYconMovimiento =
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finoYconMovimiento) return;

    let animando = false;
    const alMover = (e) => {
      if (animando) return;
      animando = true;
      requestAnimationFrame(() => {
        const r = escena.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        escena.style.setProperty('--giro-y', `${x * 18}deg`);
        escena.style.setProperty('--giro-x', `${-y * 12}deg`);
        animando = false;
      });
    };
    const alSalir = () => {
      escena.style.setProperty('--giro-y', '0deg');
      escena.style.setProperty('--giro-x', '0deg');
    };

    escena.addEventListener('pointermove', alMover);
    escena.addEventListener('pointerleave', alSalir);
    return () => {
      escena.removeEventListener('pointermove', alMover);
      escena.removeEventListener('pointerleave', alSalir);
    };
  }, []);

  return (
    <section className="hero">
      <div className="hero-grid-lines" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-text">
          <span className="pill">100 % originales de Apple</span>
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

        {/* Plató virtual: pedestal, foco, sombra de contacto y reflejo */}
        <div className="hero-visual">
          <div className="escena3d" ref={escenaRef}>
            <div className="escena-foco" aria-hidden="true" />
            <div className="escena-pedestal" aria-hidden="true" />

            <div className="escena-pieza">
              <img
                className="hero-foto"
                src="/img/apple-adaptador-ficha.jpg"
                alt="Adaptador de corriente USB-C de 20 W original de Apple, en su caja precintada"
                width="520"
                height="520"
              />
            </div>

            <div className="escena-sombra" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

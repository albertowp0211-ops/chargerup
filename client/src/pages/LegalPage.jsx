import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { MARCA, rellenarTokens } from '../config.js';
import { PAGINAS } from '../legal-textos.js';

// ⚠️ Los textos legales son plantillas orientativas (ver legal-textos.js).
// Los datos de la empresa se toman de config.js: mientras estén vacíos,
// aparecerán marcados como [PENDIENTE: …] para no publicarlos incompletos.

export default function LegalPage() {
  const { slug } = useParams();
  const pagina = PAGINAS[slug];

  usePageMeta(
    pagina ? `${pagina.titulo} — ${MARCA}` : `Página no encontrada — ${MARCA}`,
    pagina ? `${pagina.titulo} de ${MARCA}.` : undefined
  );

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
          <h2>{rellenarTokens(s.h)}</h2>
          {s.p.map((parrafo, i) => (
            <p key={i}>{rellenarTokens(parrafo)}</p>
          ))}
        </section>
      ))}
      <p className="legal-update">Última actualización: julio de 2026</p>
    </div>
  );
}

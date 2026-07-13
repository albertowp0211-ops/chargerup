import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext.jsx';

const OFERTA_FALLBACK = {
  titulo: '-30% en cargadores GaN esta semana',
  descripcion: 'Usa el código CHARGE30 al finalizar tu compra',
  codigo: 'CHARGE30',
  boton: 'Aprovechar oferta',
};

export default function OfferBanner() {
  const [oferta, setOferta] = useState(OFERTA_FALLBACK);
  const showToast = useToast();

  useEffect(() => {
    fetch('/api/offer')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setOferta)
      .catch(() => {
        // Si la API no responde se mantiene la oferta por defecto
      });
  }, []);

  return (
    <section className="cta" id="ofertas">
      <div>
        <h2>{oferta.titulo}</h2>
        <p>{oferta.descripcion}</p>
      </div>
      <a
        className="btn"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          navigator.clipboard?.writeText(oferta.codigo);
          showToast(`Código ${oferta.codigo} copiado`);
        }}
      >
        {oferta.boton}
      </a>
    </section>
  );
}

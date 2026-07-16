import { useEffect } from 'react';

// Actualiza el título del documento y la meta descripción de la página,
// restaurando los valores anteriores al desmontar (navegación SPA).
// Acepta valores undefined mientras los datos aún se están cargando.
export function usePageMeta(titulo, descripcion) {
  useEffect(() => {
    const tituloAnterior = document.title;
    if (titulo) document.title = titulo;

    // Busca (o crea) la etiqueta <meta name="description">
    let meta = document.querySelector('meta[name="description"]');
    let creada = false;
    if (!meta && descripcion) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
      creada = true;
    }
    const descripcionAnterior = meta ? meta.getAttribute('content') : null;
    if (meta && descripcion) meta.setAttribute('content', descripcion);

    return () => {
      document.title = tituloAnterior;
      if (creada) {
        meta.remove();
      } else if (meta && descripcionAnterior !== null) {
        meta.setAttribute('content', descripcionAnterior);
      }
    };
  }, [titulo, descripcion]);
}

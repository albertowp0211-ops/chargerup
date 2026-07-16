import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart, euros } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useSearch, normalizar } from '../context/SearchContext.jsx';

export default function ProductsSection() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [categoria, setCategoria] = useState('Todos');
  const { addItem } = useCart();
  const showToast = useToast();
  const { busqueda } = useSearch();

  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setProductos)
      .catch(() => setError(true))
      .finally(() => setCargando(false));
  }, []);

  const categorias = useMemo(
    () => ['Todos', ...new Set(productos.map((p) => p.categoria))],
    [productos]
  );

  // La búsqueda cubre también descripción y características ("GaN", "MacBook"…)
  const termino = normalizar(busqueda.trim());
  const visibles = productos.filter(
    (p) =>
      (categoria === 'Todos' || p.categoria === categoria) &&
      (termino === '' ||
        normalizar(
          `${p.nombre} ${p.categoria} ${p.tag} ${p.descripcion ?? ''} ${(p.caracteristicas ?? []).join(' ')}`
        ).includes(termino))
  );

  // Sugerencias cuando el filtro no devuelve nada: los más vendidos
  const bestsellers = useMemo(() => {
    const destacados = productos.filter((p) => p.hot);
    return (destacados.length > 0 ? destacados : productos).slice(0, 3);
  }, [productos]);

  const tarjeta = (p) => {
    const dto =
      p.precioAntes && p.precioAntes > p.precio
        ? Math.round((1 - p.precio / p.precioAntes) * 100)
        : 0;
    const agotado = p.disponible === false;
    return (
    <div className={`product ${agotado ? 'agotado' : ''}`} key={p.id}>
      <Link className="product-link" to={`/producto/${p.id}`}>
        <div className="img">
          {agotado ? (
            <span className="agotado-badge">Agotado</span>
          ) : (
            dto > 0 && <span className="dto-badge">−{dto}%</span>
          )}
          <span className="img-emoji">{p.imagen}</span>
        </div>
        <span className={`tag ${p.hot ? 'hot' : ''}`}>{p.tag}</span>
        <h3>{p.nombre}</h3>
        {p.descripcion && <p className="product-desc">{p.descripcion}</p>}
      </Link>
      <div className="price-row">
        <div className="price">
          {euros(p.precio)}
          {p.precioAntes ? <small>{euros(p.precioAntes)}</small> : null}
        </div>
        {agotado ? (
          <button className="add-btn" disabled>
            Agotado
          </button>
        ) : (
          <button
            className="add-btn"
            onClick={() => {
              addItem(p);
              showToast(`✓ Añadido al carrito: ${p.nombre}`, {
                label: 'Ver carrito',
                to: '/carrito',
              });
            }}
          >
            Añadir
          </button>
        )}
      </div>
    </div>
    );
  };

  return (
    <section className="catalog container" id="catalogo">
      <div className="catalog-head">
        <div>
          <h2>Nuestros cargadores</h2>
          <p>
            {termino
              ? `Resultados para "${busqueda.trim()}" (${visibles.length})`
              : 'Los más vendidos de esta semana'}
          </p>
        </div>
        <div className="cats">
          {categorias.map((c) => (
            <button
              key={c}
              className={`cat ${c === categoria ? 'active' : ''}`}
              onClick={() => setCategoria(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="catalog-empty">
          No se han podido cargar los productos. Comprueba que el servidor está en marcha.
        </p>
      )}

      {cargando && !error && (
        <div className="grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="product skeleton" key={i}>
              <div className="sk-img" />
              <div className="sk-line sk-tag" />
              <div className="sk-line" />
              <div className="sk-line sk-corta" />
            </div>
          ))}
        </div>
      )}

      {!error && !cargando && productos.length > 0 && visibles.length === 0 && (
        <>
          <p className="catalog-empty">
            No hay productos que coincidan con tu búsqueda.
          </p>
          {bestsellers.length > 0 && (
            <>
              <p className="catalog-sugerencias">Quizá te interesen nuestros más vendidos:</p>
              <div className="grid grid-3">{bestsellers.map(tarjeta)}</div>
            </>
          )}
        </>
      )}

      <div className="grid">{visibles.map(tarjeta)}</div>
    </section>
  );
}

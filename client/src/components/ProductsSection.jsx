import { useEffect, useMemo, useState } from 'react';
import { useCart, euros } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ProductsSection() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState(false);
  const [categoria, setCategoria] = useState('Todos');
  const { addItem } = useCart();
  const showToast = useToast();

  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setProductos)
      .catch(() => setError(true));
  }, []);

  const categorias = useMemo(
    () => ['Todos', ...new Set(productos.map((p) => p.categoria))],
    [productos]
  );

  const visibles =
    categoria === 'Todos'
      ? productos
      : productos.filter((p) => p.categoria === categoria);

  return (
    <section className="catalog container" id="catalogo">
      <div className="catalog-head">
        <div>
          <h2>Nuestros cargadores</h2>
          <p>Los más vendidos de esta semana</p>
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

      <div className="grid">
        {visibles.map((p) => (
          <div className="product" key={p.id}>
            <div className="img">{p.imagen}</div>
            <span className={`tag ${p.hot ? 'hot' : ''}`}>{p.tag}</span>
            <h3>{p.nombre}</h3>
            <div className="stars">
              {'★'.repeat(p.rating)}
              {'☆'.repeat(5 - p.rating)} <small>({p.reviews})</small>
            </div>
            <div className="price-row">
              <div className="price">
                {euros(p.precio)}
                {p.precioAntes ? <small>{euros(p.precioAntes)}</small> : null}
              </div>
              <button
                className="add-btn"
                onClick={() => {
                  addItem(p);
                  showToast(`✓ Añadido al carrito: ${p.nombre}`);
                }}
              >
                Añadir
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

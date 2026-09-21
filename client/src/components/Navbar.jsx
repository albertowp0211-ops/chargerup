import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useSearch } from '../context/SearchContext.jsx';
import { WHATSAPP_URL } from '../config.js';

export default function Navbar() {
  const { count } = useCart();
  const { busqueda, setBusqueda } = useSearch();
  const [buscarAbierto, setBuscarAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const onBuscar = (e) => {
    setBusqueda(e.target.value);
    // El catálogo vive en la portada: si se busca desde otra página, vamos a ella
    if (location.pathname !== '/') navigate('/');
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav>
      <div className="container nav-inner">
        <div className="nav-links">
          <Link to="/">Inicio</Link>
          <a href="/#catalogo">Catálogo</a>
          <a href="/#por-que">Por qué original</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">Contacto</a>
        </div>
        <input
          className="nav-search"
          type="text"
          placeholder="🔍  Buscar..."
          aria-label="Buscar productos"
          value={busqueda}
          onChange={onBuscar}
        />
        <button
          className="search-toggle"
          title="Buscar"
          aria-label="Abrir buscador"
          onClick={() => setBuscarAbierto((o) => !o)}
        >
          🔍
        </button>
        <Link
          to="/carrito"
          className="cart-btn"
          title="Ver carrito"
          aria-label={`Ver carrito (${count} artículos)`}
        >
          🛒<span className="cart-badge">{count}</span>
        </Link>
      </div>
      {buscarAbierto && (
        <div className="nav-search-mobile">
          <input
            type="text"
            placeholder="🔍  Buscar..."
            aria-label="Buscar productos"
            value={busqueda}
            onChange={onBuscar}
            autoFocus
          />
        </div>
      )}
    </nav>
  );
}

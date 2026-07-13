import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useSearch } from '../context/SearchContext.jsx';

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
        <Link to="/" className="logo">
          Charge<span>Up</span> ⚡
        </Link>
        <div className="nav-links">
          <a href="/#catalogo">Catálogo</a>
          <a href="/#ofertas">Ofertas</a>
          <a href="#">Contacto</a>
        </div>
        <input
          className="nav-search"
          type="text"
          placeholder="🔍  Buscar cargadores..."
          value={busqueda}
          onChange={onBuscar}
        />
        <button
          className="search-toggle"
          title="Buscar"
          onClick={() => setBuscarAbierto((o) => !o)}
        >
          🔍
        </button>
        <Link to="/carrito" className="cart-btn" title="Ver carrito">
          🛒<span className="cart-badge">{count}</span>
        </Link>
      </div>
      {buscarAbierto && (
        <div className="nav-search-mobile">
          <input
            type="text"
            placeholder="🔍  Buscar cargadores..."
            value={busqueda}
            onChange={onBuscar}
            autoFocus
          />
        </div>
      )}
    </nav>
  );
}

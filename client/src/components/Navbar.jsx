import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { count } = useCart();

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
        <input className="nav-search" type="text" placeholder="🔍  Buscar cargadores..." />
        <Link to="/carrito" className="cart-btn" title="Ver carrito">
          🛒<span className="cart-badge">{count}</span>
        </Link>
      </div>
    </nav>
  );
}

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <div>
          <div className="logo">
            Charge<span style={{ color: '#60a5fa' }}>Up</span> ⚡
          </div>
          <p>
            Especialistas en tecnología de carga rápida desde 2020. Más de 50.000
            clientes satisfechos.
          </p>
        </div>
        <div>
          <h4>Tienda</h4>
          <ul>
            <li><a href="#">Cargadores USB-C</a></li>
            <li><a href="#">Inalámbricos</a></li>
            <li><a href="#">Powerbanks</a></li>
            <li><a href="#">Cables</a></li>
          </ul>
        </div>
        <div>
          <h4>Ayuda</h4>
          <ul>
            <li><Link to="/legal/devoluciones">Envíos y devoluciones</Link></li>
            <li><Link to="/legal/aviso-legal">Aviso legal</Link></li>
            <li><Link to="/legal/privacidad">Privacidad</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contacto</h4>
          <ul>
            <li><a href="#">hola@chargeup.es</a></li>
            <li><a href="#">+34 900 123 456</a></li>
            <li><a href="#">Instagram</a></li>
            <li><Link to="/admin">Panel de pedidos</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© 2026 ChargeUp · Todos los derechos reservados</div>
    </footer>
  );
}

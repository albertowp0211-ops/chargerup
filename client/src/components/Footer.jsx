import { Link } from 'react-router-dom';
import { MARCA, EMAIL_CONTACTO, TELEFONO_CONTACTO, TELEFONO_TEL } from '../config.js';

export default function Footer() {
  const anio = new Date().getFullYear();
  return (
    <footer>
      <div className="container footer-inner">
        <div>
          <p className="footer-claim">
            Accesorios de carga <b>originales de Apple</b>. Nada de réplicas:
            el adaptador y el cable que Apple diseñó para tu iPhone, con envío
            desde España y pago seguro con Stripe.
          </p>
        </div>
        <div>
          <h4>Tienda</h4>
          <ul>
            <li><a href="/#catalogo">Pack adaptador + cable</a></li>
            <li><a href="/#catalogo">Adaptador 20W original</a></li>
            <li><a href="/#catalogo">Cable USB-C de tela</a></li>
            <li><a href="/#por-que">Por qué original</a></li>
          </ul>
        </div>
        <div>
          <h4>Información legal</h4>
          <ul>
            <li><Link to="/legal/aviso-legal">Aviso legal</Link></li>
            <li><Link to="/legal/privacidad">Privacidad</Link></li>
            <li><Link to="/legal/cookies">Cookies</Link></li>
            <li><Link to="/legal/condiciones">Condiciones de compra</Link></li>
            <li><Link to="/legal/envios-devoluciones">Envíos y devoluciones</Link></li>
          </ul>
        </div>
        <div>
          <h4>Contacto</h4>
          <ul>
            <li><a href={`mailto:${EMAIL_CONTACTO}`}>{EMAIL_CONTACTO}</a></li>
            <li><a href={`tel:${TELEFONO_TEL}`}>{TELEFONO_CONTACTO}</a></li>
            <li><Link to="/legal/desistimiento">Derecho de desistimiento</Link></li>
            <li><Link to="/desistir">Desistir del contrato</Link></li>
            <li><Link to="/admin">Panel de pedidos</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© {anio} {MARCA} · Todos los derechos reservados</div>
    </footer>
  );
}

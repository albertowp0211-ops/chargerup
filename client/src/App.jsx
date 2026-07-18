import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import ProductPage from './pages/ProductPage.jsx';
import { ENVIO_GRATIS_DESDE, MARCA } from './config.js';
import { usePageMeta } from './hooks/usePageMeta.js';

// Páginas secundarias cargadas bajo demanda: el panel de admin y el flujo
// de pago no viajan en el bundle inicial de cada visitante
const CartPage = lazy(() => import('./pages/CartPage.jsx'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage.jsx'));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const LegalPage = lazy(() => import('./pages/LegalPage.jsx'));
const DesistirPage = lazy(() => import('./pages/DesistirPage.jsx'));

// Sube al principio de la página en cada cambio de ruta: los enlaces del
// footer abrían las páginas legales scrolleadas al fondo. Si hay hash
// (p. ej. /#catalogo) dejamos que el navegador gestione el ancla.
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function NotFoundPage() {
  usePageMeta(
    `Página no encontrada — ${MARCA}`,
    `La página que buscas no existe en ${MARCA}.`
  );
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

// Mismo patrón de "Cargando…" que usan las páginas mientras piden datos
const cargando = (
  <div className="container page">
    <p className="catalog-empty">Cargando…</p>
  </div>
);

export default function App() {
  return (
    <>
      <div className="topbar">
        🚚 <b>Envío gratis</b> en pedidos a partir de {ENVIO_GRATIS_DESDE}€ · Devoluciones en 14 días
      </div>
      <Navbar />
      <ScrollToTop />
      <Suspense fallback={cargando}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/producto/:id" element={<ProductPage />} />
          <Route path="/carrito" element={<CartPage />} />
          <Route path="/pedido" element={<CheckoutPage />} />
          <Route path="/pedido/exito" element={<PaymentSuccessPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/desistir" element={<DesistirPage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

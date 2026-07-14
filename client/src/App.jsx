import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ProductPage from './pages/ProductPage.jsx';

export default function App() {
  return (
    <>
      <div className="topbar">
        🚚 <b>Envío gratis</b> en pedidos superiores a 25€ · Devoluciones en 30 días
      </div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/producto/:id" element={<ProductPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/pedido" element={<CheckoutPage />} />
        <Route path="/pedido/exito" element={<PaymentSuccessPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Footer />
    </>
  );
}

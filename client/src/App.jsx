import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <>
      <div className="topbar">
        🚚 <b>Envío gratis</b> en pedidos superiores a 25€ · Devoluciones en 30 días
      </div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/pedido" element={<CheckoutPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Footer />
    </>
  );
}

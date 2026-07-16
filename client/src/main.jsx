import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { SearchProvider } from './context/SearchContext.jsx';
import './index.css';

// Despierta el dyno de Render en la primera visita (cold start del catálogo)
fetch('/api/health').catch(() => {});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <CartProvider>
          <SearchProvider>
            <App />
            <Analytics />
          </SearchProvider>
        </CartProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

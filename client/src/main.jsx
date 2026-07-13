import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { SearchProvider } from './context/SearchContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <CartProvider>
          <SearchProvider>
            <App />
          </SearchProvider>
        </CartProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);

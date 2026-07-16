import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'chargeup-cart';
const STORAGE_PROMO = 'chargeup-promo';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    } catch {
      return [];
    }
  });

  // Código promocional aplicado: { codigo, pct } validado por el servidor.
  // El pct guardado solo pinta el desglose; el precio final lo recalcula
  // siempre el servidor al pagar.
  const [promo, setPromo] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_PROMO));
      return p && typeof p.codigo === 'string' && Number.isFinite(p.pct) ? p : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (promo) localStorage.setItem(STORAGE_PROMO, JSON.stringify(promo));
    else localStorage.removeItem(STORAGE_PROMO);
  }, [promo]);

  const addItem = (producto) =>
    setItems((prev) => {
      const existente = prev.find((i) => i.id === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.id === producto.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagen,
          qty: 1,
        },
      ];
    });

  const setQty = (id, qty) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => {
    setItems([]);
    setPromo(null);
  };

  const aplicarPromo = (p) => setPromo(p);
  const quitarPromo = () => setPromo(null);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.precio, 0);
  // Mismo redondeo al céntimo que hace el servidor (Math.round(subtotal*pct))
  // para que el desglose de la web coincida exactamente con lo que cobra Stripe.
  const descuento = promo ? Math.round(total * promo.pct) / 100 : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        setQty,
        removeItem,
        clearCart,
        count,
        total,
        promo,
        descuento,
        aplicarPromo,
        quitarPromo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

export const euros = (n) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'chargeup-cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

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
  const clearCart = () => setItems([]);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.precio, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, setQty, removeItem, clearCart, count, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

export const euros = (n) =>
  n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });

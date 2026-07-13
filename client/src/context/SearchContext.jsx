import { createContext, useContext, useState } from 'react';

const SearchContext = createContext({ busqueda: '', setBusqueda: () => {} });

export function SearchProvider({ children }) {
  const [busqueda, setBusqueda] = useState('');
  return (
    <SearchContext.Provider value={{ busqueda, setBusqueda }}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => useContext(SearchContext);

// Normaliza para comparar sin mayúsculas ni tildes: "Inalámbrico" → "inalambrico"
export const normalizar = (texto) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

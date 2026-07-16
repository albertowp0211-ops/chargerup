import Hero from '../components/Hero.jsx';
import Features from '../components/Features.jsx';
import ProductsSection from '../components/ProductsSection.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { MARCA } from '../config.js';

export default function Home() {
  usePageMeta(
    `${MARCA} — Cargadores rápidos con envío desde España`,
    'Cargadores USB-C, inalámbricos, powerbanks y cables de carga rápida con garantía de 3 años y envío desde España.'
  );

  return (
    <>
      <Hero />
      <Features />
      <ProductsSection />
    </>
  );
}

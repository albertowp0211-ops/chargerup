import Hero from '../components/Hero.jsx';
import Features from '../components/Features.jsx';
import WhyOriginal from '../components/WhyOriginal.jsx';
import ProductsSection from '../components/ProductsSection.jsx';
import Faq from '../components/Faq.jsx';
import BarraCompra from '../components/BarraCompra.jsx';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { MARCA } from '../config.js';

export default function Home() {
  usePageMeta(
    `${MARCA} — Cargadores originales de Apple`,
    'Adaptador de corriente Apple de 20W y cable USB-C de tela, originales. Carga rápida que cuida la batería del iPhone, con envío desde España en 24/48 horas.'
  );

  return (
    <>
      <Hero />
      <Features />
      <ProductsSection />
      <WhyOriginal />
      <Faq />
      <BarraCompra />
    </>
  );
}

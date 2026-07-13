import Hero from '../components/Hero.jsx';
import Features from '../components/Features.jsx';
import ProductsSection from '../components/ProductsSection.jsx';
import OfferBanner from '../components/OfferBanner.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <ProductsSection />
      <div className="container">
        <OfferBanner />
      </div>
    </>
  );
}

import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductGrid } from '@/components/ProductGrid';
import { CategoryShowcase } from '@/components/CategoryShowcase';
import { Features } from '@/components/Features';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <ProductGrid 
          title="Featured Collection" 
          subtitle="New Arrivals" 
          limit={8} 
        />
        <CategoryShowcase />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

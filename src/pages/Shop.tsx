import { Header } from '@/components/Header';
import { ProductGrid } from '@/components/ProductGrid';
import { Footer } from '@/components/Footer';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const Shop = () => {
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  
  const categoryTitles: Record<string, string> = {
    bikinis: 'Bikinis',
    'one-pieces': 'One-Pieces',
    'cover-ups': 'Cover-ups',
    accessories: 'Accessories',
  };

  const title = category ? categoryTitles[category] || 'Shop' : 'Shop All';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-24">
        {/* Page header */}
        <section className="py-16 md:py-24 text-center border-b border-border">
          <div className="container mx-auto px-4 md:px-8">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-primary font-sans text-sm tracking-[0.4em] uppercase mb-4"
            >
              Collection
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-5xl md:text-6xl tracking-wide"
            >
              {title}
            </motion.h1>
          </div>
        </section>

        <ProductGrid limit={24} />
      </main>
      <Footer />
    </div>
  );
};

export default Shop;

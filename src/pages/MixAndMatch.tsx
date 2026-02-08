import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, RotateCcw, Loader2 } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { PRODUCT_SIZES } from '@/lib/constants';
import { useAdminStore } from '@/stores/adminStore';
import { useMemo } from 'react';

export default function MixAndMatch() {
  const { user } = useAuthStore();
  const { data: allProducts, isLoading } = useProducts(100);
  const { productOverrides } = useAdminStore();

  const tops = useMemo(() => {
    return allProducts.filter(p => {
      const category = p.category || (p.productType?.toLowerCase().includes('top') ? 'Top' : '');
      return category === 'Top';
    });
  }, [allProducts]);

  const bottoms = useMemo(() => {
    return allProducts.filter(p => {
      const category = p.category || (p.productType?.toLowerCase().includes('bottom') ? 'Bottom' : '');
      return category === 'Bottom';
    });
  }, [allProducts]);

  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [topSize, setTopSize] = useState(user?.preferredSize || 'M');
  const [bottomSize, setBottomSize] = useState(user?.preferredSize || 'M');
  const addItem = useCartStore(state => state.addItem);

  const currentTop = tops[topIndex];
  const currentBottom = bottoms[bottomIndex];

  const handleNextTop = () => setTopIndex((prev) => (prev + 1) % tops.length);
  const handlePrevTop = () => setTopIndex((prev) => (prev - 1 + tops.length) % tops.length);
  const handleNextBottom = () => setBottomIndex((prev) => (prev + 1) % bottoms.length);
  const handlePrevBottom = () => setBottomIndex((prev) => (prev - 1 + bottoms.length) % bottoms.length);

  const handleRandomize = () => {
    setTopIndex(Math.floor(Math.random() * tops.length));
    setBottomIndex(Math.floor(Math.random() * bottoms.length));
  };

  const handleAddSetToCart = () => {
    addItem({
      product: currentTop,
      variantId: `${currentTop.id}-${topSize.toLowerCase()}`,
      variantTitle: topSize,
      price: currentTop.price,
      quantity: 1,
      selectedOptions: [{ name: 'Size', value: topSize }]
    });
    
    addItem({
      product: currentBottom,
      variantId: `${currentBottom.id}-${bottomSize.toLowerCase()}`,
      variantTitle: bottomSize,
      price: currentBottom.price,
      quantity: 1,
      selectedOptions: [{ name: 'Size', value: bottomSize }]
    });
    
    toast.success('Set added to your bag!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (tops.length === 0 || bottoms.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <h2 className="font-serif text-2xl">Not enough products</h2>
          <p className="text-muted-foreground">Add some Tops and Bottoms to use Mix & Match.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl mb-4">Mix & Match</h1>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Create your perfect pairing. Select a top and a bottom to see how they look together.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Top Selector */}
            <div className="relative group">
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-secondary/30 border border-border/50 shadow-lg">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentTop.id}
                    src={currentTop.images[0]?.url}
                    alt={currentTop.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <Button variant="outline" size="icon" className="rounded-full bg-background/80" onClick={handlePrevTop}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full bg-background/80" onClick={handleNextTop}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center">
                <h3 className="font-serif text-xl mb-3">{currentTop.title}</h3>
                <div className="flex justify-center gap-1 mb-3">
                  {PRODUCT_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setTopSize(size)}
                      className={`w-10 h-10 text-[10px] border rounded-full transition-colors ${
                        topSize === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-primary font-sans">${parseFloat(currentTop.price.amount).toFixed(2)}</p>
              </div>
            </div>

            {/* Bottom Selector */}
            <div className="relative group">
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-secondary/30 border border-border/50 shadow-lg">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentBottom.id}
                    src={currentBottom.images[0]?.url}
                    alt={currentBottom.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 flex items-center justify-between px-4">
                  <Button variant="outline" size="icon" className="rounded-full bg-background/80" onClick={handlePrevBottom}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full bg-background/80" onClick={handleNextBottom}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 text-center">
                <h3 className="font-serif text-xl mb-3">{currentBottom.title}</h3>
                <div className="flex justify-center gap-1 mb-3">
                  {PRODUCT_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setBottomSize(size)}
                      className={`w-10 h-10 text-[10px] border rounded-full transition-colors ${
                        bottomSize === size
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-primary font-sans">${parseFloat(currentBottom.price.amount).toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16">
            <Button variant="outline" size="lg" className="rounded-full" onClick={handleRandomize}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Surprise Me
            </Button>
            <Button size="lg" className="rounded-full px-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-gold" onClick={handleAddSetToCart}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add Set to Bag — ${(parseFloat(currentTop.price.amount) + parseFloat(currentBottom.price.amount)).toFixed(2)}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

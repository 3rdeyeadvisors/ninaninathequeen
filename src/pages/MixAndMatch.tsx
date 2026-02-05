
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, RotateCcw } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { mapMockToShopify } from '@/lib/shopify';
import { toast } from 'sonner';

export default function MixAndMatch() {
  const tops = MOCK_PRODUCTS.filter(p => p.category === 'Top');
  const bottoms = MOCK_PRODUCTS.filter(p => p.category === 'Bottom');

  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
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

  const handleAddSetToCart = async () => {
    // In a real scenario, we would fetch the Shopify variant IDs.
    // For this mock, we'll simulate adding two items.
    toast.promise(
      Promise.all([
        addItem({
          product: mapMockToShopify(currentTop),
          variantId: 'gid://shopify/ProductVariant/' + currentTop.id + '-default',
          variantTitle: 'Default Title',
          price: { amount: currentTop.price.toString(), currencyCode: 'USD' },
          quantity: 1,
          selectedOptions: [{ name: 'Title', value: 'Default Title' }]
        }),
        addItem({
          product: mapMockToShopify(currentBottom),
          variantId: 'gid://shopify/ProductVariant/' + currentBottom.id + '-default',
          variantTitle: 'Default Title',
          price: { amount: currentBottom.price.toString(), currencyCode: 'USD' },
          quantity: 1,
          selectedOptions: [{ name: 'Title', value: 'Default Title' }]
        })
      ]),
      {
        loading: 'Adding set to bag...',
        success: 'Set added successfully!',
        error: 'Failed to add set.'
      }
    );
  };

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
                    src={currentTop.images[0]}
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
                <h3 className="font-serif text-xl">{currentTop.title}</h3>
                <p className="text-sm text-primary font-sans">${currentTop.price.toFixed(2)}</p>
              </div>
            </div>

            {/* Bottom Selector */}
            <div className="relative group">
              <div className="aspect-[4/5] overflow-hidden rounded-lg bg-secondary/30 border border-border/50 shadow-lg">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentBottom.id}
                    src={currentBottom.images[0]}
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
                <h3 className="font-serif text-xl">{currentBottom.title}</h3>
                <p className="text-sm text-primary font-sans">${currentBottom.price.toFixed(2)}</p>
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
              Add Set to Bag — ${(currentTop.price + currentBottom.price).toFixed(2)}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

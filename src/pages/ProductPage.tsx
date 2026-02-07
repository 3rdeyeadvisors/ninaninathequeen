import { useParams, Link } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { ReviewSection } from '@/components/ReviewSection';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart, Minus, Plus, Loader2, ChevronLeft, Truck, Shield, RotateCcw, Box } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

const ProductPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const { data: product, isLoading, error } = useProduct(handle || '');

  useEffect(() => {
    if (product) {
      const views = JSON.parse(localStorage.getItem('product_views') || '{}');
      views[product.id] = (views[product.id] || 0) + 1;
      localStorage.setItem('product_views', JSON.stringify(views));

      // Also store product info for the dashboard
      const productInfo = JSON.parse(localStorage.getItem('tracked_products') || '{}');
      productInfo[product.id] = {
        title: product.title,
        image: product.images.edges[0]?.node.url,
        price: product.priceRange.minVariantPrice.amount
      };
      localStorage.setItem('tracked_products', JSON.stringify(productInfo));
    }
  }, [product]);
  const addItem = useCartStore(state => state.addItem);
  const isCartLoading = useCartStore(state => state.isLoading);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { user } = useAuthStore();
  
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Auto-select preferred size
  useEffect(() => {
    if (product && user?.preferredSize) {
      const preferredIndex = product.variants.edges.findIndex(v =>
        v.node.selectedOptions.some(so => so.name === 'Size' && so.value === user.preferredSize)
      );
      if (preferredIndex !== -1) {
        setSelectedVariantIndex(preferredIndex);
      }
    }
  }, [product, user?.preferredSize]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [is360View, setIs360View] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-20">
          <h1 className="font-serif text-3xl mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/shop">Return to Shop</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images.edges;
  const variants = product.variants.edges;
  const selectedVariant = variants[selectedVariantIndex]?.node;
  const mainImage = images[selectedImageIndex]?.node;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    setIsAdding(true);
    await addItem({
      product: { node: product },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity,
      selectedOptions: selectedVariant.selectedOptions || []
    });
    setIsAdding(false);
    
    toast.success('Added to bag', {
      description: `${product.title} × ${quantity}`,
      position: 'top-center',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40">
        <div className="container mx-auto px-4 md:px-8 pb-16">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8"
          >
            <Link 
              to="/shop" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Shop
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Image gallery */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Main image / 360 Viewer */}
              <div className="relative mb-4">
                {is360View ? (
                  <ThreeSixtyViewer images={images.map(img => img.node.url)} />
                ) : (
                  <div className="aspect-[3/4] bg-card rounded-sm overflow-hidden">
                    {mainImage && (
                      <img
                        src={mainImage.url}
                        alt={mainImage.altText || product.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}

                {images.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm border-primary/20"
                    onClick={() => setIs360View(!is360View)}
                  >
                    <Box className="h-4 w-4 mr-2" />
                    {is360View ? 'Standard View' : '360° Spin'}
                  </Button>
                )}
              </div>
              
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-24 rounded-sm overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index ? 'border-primary' : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img
                        src={img.node.url}
                        alt={img.node.altText || `${product.title} view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:py-8"
            >
              <h1 className="font-serif text-4xl md:text-5xl tracking-wide mb-4">
                {product.title}
              </h1>
              
              <p className="text-2xl md:text-3xl text-primary font-serif mb-6">
                {selectedVariant?.price.currencyCode} {parseFloat(selectedVariant?.price.amount || '0').toFixed(2)}
              </p>

              {product.description && (
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {product.description}
                </p>
              )}

              {/* Variants/Options */}
              {product.options.map((option, optionIndex) => (
                option.values.length > 1 && (
                  <div key={option.name} className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-sans tracking-wider uppercase">
                        {option.name}
                      </label>
                      {option.name.toLowerCase().includes('size') && (
                        <Link
                          to="/size-quiz"
                          className="text-xs text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                        >
                          Find My Size
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const variantWithValue = variants.findIndex(v => 
                          v.node.selectedOptions.some(so => so.name === option.name && so.value === value)
                        );
                        const isSelected = selectedVariant?.selectedOptions.some(
                          so => so.name === option.name && so.value === value
                        );
                        
                        return (
                          <button
                            key={value}
                            onClick={() => setSelectedVariantIndex(variantWithValue !== -1 ? variantWithValue : 0)}
                            className={`px-4 py-2 text-sm border rounded-sm transition-colors ${
                              isSelected 
                                ? 'border-primary bg-primary/10 text-primary' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}

              {/* Quantity */}
              <div className="mb-8">
                <label className="block text-sm font-sans tracking-wider uppercase mb-3">
                  Quantity
                </label>
                <div className="inline-flex items-center border border-border rounded-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to cart */}
              <div className="flex gap-4 mb-8">
                <Button
                  onClick={handleAddToCart}
                  disabled={isCartLoading || isAdding || !selectedVariant?.availableForSale}
                  size="lg"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-sans tracking-wider py-6"
                >
                  {isAdding ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : !selectedVariant?.availableForSale ? (
                    'Sold Out'
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Add to Bag
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className={`px-6 border-border hover:border-primary/50 ${
                    isInWishlist(product.id) ? 'text-primary border-primary/30 bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    toggleItem({
                      id: product.id,
                      title: product.title,
                      handle: product.handle,
                      image: product.images.edges[0]?.node.url || '',
                      price: product.priceRange.minVariantPrice.amount
                    });
                    if (!isInWishlist(product.id)) {
                      toast.success('Added to wishlist');
                    } else {
                      toast.info('Removed from wishlist');
                    }
                  }}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {/* Features */}
              <div className="space-y-4 pt-8 border-t border-border">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Truck className="h-5 w-5 text-primary" />
                  <span>Free shipping on 2+ bikini sets</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Premium quality guaranteed</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <RotateCcw className="h-5 w-5 text-primary" />
                  <span>Easy 30-day returns</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Review Section */}
          <ReviewSection productId={product.id} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductPage;

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Product } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAdminStore } from '@/stores/adminStore';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2, Heart, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { productOverrides } = useAdminStore();
  const { user } = useAuthStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const mainImage = product.images[0];
  const hoverImage = product.images[1] || mainImage;
  const price = product.price;
  const firstVariant = product.variants[0];
  
  // Check if product is in "Top & Bottom" category for $10 discount
  const override = productOverrides[product.id];
  const isTopAndBottom = override?.category === 'Top & Bottom' || 
                         product.category === 'Top & Bottom' ||
                         product.productType === 'Top & Bottom';
  const originalPrice = parseFloat(price.amount);
  const discountedPrice = isTopAndBottom ? originalPrice - 10 : originalPrice;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let selectedVariant = firstVariant;
    if (user?.preferredSize) {
      const preferredVariant = product.variants.find(v =>
        v.selectedOptions.some(so => so.name === 'Size' && so.value === user.preferredSize)
      );
      if (preferredVariant) {
        selectedVariant = preferredVariant;
      }
    }

    if (!selectedVariant) return;

    setIsAdding(true);
    await addItem({
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || []
    });
    setIsAdding(false);
    
    toast.success('Added to bag', {
      description: product.title,
      position: 'top-center',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.handle}`} className="block">
        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-card rounded-sm mb-4">
          {/* $10 Off Badge for Top & Bottom */}
          {isTopAndBottom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-4 left-4 bg-primary text-primary-foreground px-2 py-1 rounded-sm flex items-center gap-1"
            >
              <Tag className="h-3 w-3" />
              <span className="font-sans text-[10px] uppercase tracking-wider font-bold">Save $10</span>
            </motion.div>
          )}
          
          {mainImage && (
            <>
              <motion.img
                src={mainImage.url}
                alt={mainImage.altText || product.title}
                className="absolute inset-0 w-full h-full object-cover"
                animate={{ opacity: isHovered && hoverImage !== mainImage ? 0 : 1 }}
                transition={{ duration: 0.5 }}
              />
              {hoverImage !== mainImage && (
                <motion.img
                  src={hoverImage.url}
                  alt={hoverImage.altText || product.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </>
          )}
          
          {/* Overlay actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-background/20 backdrop-blur-[2px] flex items-end justify-center p-4"
          >
            <Button
              onClick={handleAddToCart}
              disabled={isLoading || isAdding || !firstVariant?.availableForSale}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans tracking-wider"
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !firstVariant?.availableForSale ? (
                'Sold Out'
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Add to Bag
                </>
              )}
            </Button>
          </motion.div>

          {/* Wishlist button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered || isInWishlist(product.id) ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className={`absolute top-4 right-4 p-2 bg-background/80 rounded-full hover:bg-background transition-colors ${
              isInWishlist(product.id) ? 'text-primary' : ''
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleItem({
                id: product.id,
                title: product.title,
                handle: product.handle,
                image: mainImage?.url || '',
                price: price.amount
              });
              if (!isInWishlist(product.id)) {
                toast.success('Added to wishlist');
              } else {
                toast.info('Removed from wishlist');
              }
            }}
          >
            <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </motion.button>
        </div>

        {/* Product info */}
        <div className="space-y-1">
          <h3 className="font-serif text-lg tracking-wide group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <div className="font-sans text-sm">
            {isTopAndBottom ? (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground line-through">
                  {price.currencyCode} {originalPrice.toFixed(2)}
                </span>
                <span className="text-primary font-medium">
                  {price.currencyCode} {discountedPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {price.currencyCode} {originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

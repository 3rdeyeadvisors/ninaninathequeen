import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShopifyProduct } from '@/lib/shopify';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface ProductCardProps {
  product: ShopifyProduct;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { node } = product;
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const mainImage = node.images.edges[0]?.node;
  const hoverImage = node.images.edges[1]?.node || mainImage;
  const price = node.priceRange.minVariantPrice;
  const firstVariant = node.variants.edges[0]?.node;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!firstVariant) return;

    setIsAdding(true);
    await addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || []
    });
    setIsAdding(false);
    
    toast.success('Added to bag', {
      description: node.title,
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
      <Link to={`/product/${node.handle}`} className="block">
        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-card rounded-sm mb-4">
          {mainImage && (
            <>
              <motion.img
                src={mainImage.url}
                alt={mainImage.altText || node.title}
                className="absolute inset-0 w-full h-full object-cover"
                animate={{ opacity: isHovered && hoverImage !== mainImage ? 0 : 1 }}
                transition={{ duration: 0.5 }}
              />
              {hoverImage !== mainImage && (
                <motion.img
                  src={hoverImage.url}
                  alt={hoverImage.altText || node.title}
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
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.info('Wishlist coming soon!');
            }}
          >
            <Heart className="h-4 w-4" />
          </motion.button>
        </div>

        {/* Product info */}
        <div className="space-y-1">
          <h3 className="font-serif text-lg tracking-wide group-hover:text-primary transition-colors">
            {node.title}
          </h3>
          <p className="font-sans text-sm text-muted-foreground">
            {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

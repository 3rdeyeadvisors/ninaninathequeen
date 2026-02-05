import { useProducts, ShopifyProduct } from '@/hooks/useProducts';
import { ProductCard } from './ProductCard';
import { motion } from 'framer-motion';
import { Loader2, Package } from 'lucide-react';

interface ProductGridProps {
  query?: string;
  limit?: number;
  title?: string;
  subtitle?: string;
}

export function ProductGrid({ query, limit = 12, title, subtitle }: ProductGridProps) {
  const { data: products, isLoading, error } = useProducts(limit, query);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">Failed to load products</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-8">
          {(title || subtitle) && (
            <div className="text-center mb-16">
              {subtitle && (
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="text-primary font-sans text-sm tracking-[0.4em] uppercase mb-4"
                >
                  {subtitle}
                </motion.p>
              )}
              {title && (
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="font-serif text-4xl md:text-5xl tracking-wide"
                >
                  {title}
                </motion.h2>
              )}
            </div>
          )}
          
          <div className="text-center py-20 border border-border/30 rounded-lg bg-card/50">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-50" />
            <h3 className="font-serif text-2xl mb-4">No Products Yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The collection is being curated. Tell me about the products you'd like to add 
              — include details like name, description, and price.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-16">
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-primary font-sans text-sm tracking-[0.4em] uppercase mb-4"
              >
                {subtitle}
              </motion.p>
            )}
            {title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="font-serif text-4xl md:text-5xl tracking-wide"
              >
                {title}
              </motion.h2>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product: ShopifyProduct, index: number) => (
            <ProductCard key={product.node.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

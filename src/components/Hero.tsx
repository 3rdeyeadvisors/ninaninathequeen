import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 gradient-dark" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
      </div>
      
      {/* Content */}
      <div className="relative container mx-auto px-4 md:px-8 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-primary font-sans text-sm md:text-base tracking-[0.4em] uppercase mb-6"
          >
            Premium Brazilian Swimwear
          </motion.p>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-light tracking-wide mb-8 text-shadow"
          >
            <span className="gradient-gold-text">Elegance</span>
            <br />
            <span className="text-foreground">Redefined</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-muted-foreground font-sans text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Discover the art of Brazilian craftsmanship. Each piece is designed to 
            celebrate your silhouette with luxurious fabrics and timeless sophistication.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button 
              asChild
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans tracking-wider px-10 py-6 text-base shadow-gold"
            >
              <Link to="/shop">
                Shop Collection
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline" 
              size="lg"
              className="border-primary/50 hover:bg-primary/10 text-foreground font-sans tracking-wider px-10 py-6 text-base"
            >
              <Link to="/new-arrivals">
                New Arrivals
              </Link>
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-px h-16 bg-gradient-to-b from-primary/50 to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}

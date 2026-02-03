import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const categories = [
  {
    name: 'Bikinis',
    href: '/shop?category=bikinis',
    description: 'Classic Brazilian cuts',
  },
  {
    name: 'One-Pieces',
    href: '/shop?category=one-pieces',
    description: 'Elegant & sophisticated',
  },
  {
    name: 'Cover-ups',
    href: '/shop?category=cover-ups',
    description: 'Beach to bar ready',
  },
  {
    name: 'Accessories',
    href: '/shop?category=accessories',
    description: 'Complete the look',
  },
];

export function CategoryShowcase() {
  return (
    <section className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-primary font-sans text-sm tracking-[0.4em] uppercase mb-4"
          >
            Explore
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-5xl tracking-wide"
          >
            Shop by Category
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                to={category.href}
                className="group block aspect-[3/4] relative overflow-hidden rounded-sm bg-muted"
              >
                {/* Placeholder gradient - will be replaced with images */}
                <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50" />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="font-serif text-2xl md:text-3xl mb-2 group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                  <span className="mt-4 text-primary text-sm font-sans tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase">
                    Explore →
                  </span>
                </div>

                {/* Border glow on hover */}
                <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/30 rounded-sm transition-colors duration-500" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

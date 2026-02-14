import { motion } from 'framer-motion';
import { Star, Gift, Truck, Shield } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Worldwide Express',
    description: 'Free shipping on all orders of 2 bikini sets or more',
  },
  {
    icon: Shield,
    title: 'Brazilian Excellence',
    description: 'Handcrafted with premium double-lined Brazilian fabrics',
  },
  {
    icon: Gift,
    title: 'Luxury Presentation',
    description: 'Signature eco-friendly gold-foiled packaging',
  },
  {
    icon: Star,
    title: 'Elite Rewards',
    description: 'Exclusive access and points with every purchase',
  },
];

export function Features() {
  return (
    <section className="py-16 md:py-20 border-y border-border">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <feature.icon className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="font-serif text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <h1 className="font-serif text-4xl md:text-6xl mb-6">Our Story</h1>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              Born from the sun-drenched beaches of Rio and the sophisticated spirit of Brazilian design,
              Nina Armend is more than just swimwear.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl mb-6">The Nina Armend Vision</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Founded with a mission to celebrate the diverse beauty of women, Nina Armend combines
                unparalleled Brazilian craftsmanship with timeless, luxurious silhouettes. Every piece
                is designed to empower and inspire confidence, whether you're poolside in St. Barth's
                or on the shores of Ipanema.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our designs focus on the perfect fit, utilizing premium Italian fabrics and
                innovative construction techniques that honor the body's natural curves.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-[4/5] bg-secondary rounded-2xl overflow-hidden"
            >
              <img
                src="https://images.unsplash.com/photo-1590650213165-c1fef80648c4?auto=format&fit=crop&q=80&w=800"
                alt="Nina Armend Vision"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20 flex-row-reverse">
             <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:order-2"
            >
              <h2 className="font-serif text-3xl mb-2">Meet the Founder</h2>
              <p className="text-primary font-sans tracking-[0.2em] uppercase text-[10px] font-bold mb-6">Lydia — Founder & Owner</p>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Lydia founded Nina Armend with a clear vision: to bring the authentic soul of Brazilian beach culture to the global luxury market. Her background in fashion design and her deep connection to the coastal lifestyle of Rio de Janeiro drive the brand's creative direction.
              </p>
              <p className="text-muted-foreground leading-relaxed italic">
                "Nina Armend is a tribute to the confident, effortless elegance of the modern woman. We don't just make bikinis; we create memories of sun-kissed days and endless summers."
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-[4/5] bg-secondary rounded-2xl overflow-hidden md:order-1"
            >
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=800"
                alt="Lydia - Founder & Owner"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          <div className="bg-secondary/30 rounded-3xl p-12 md:p-20 text-center">
            <h2 className="font-serif text-3xl mb-8">Uncompromising Craftsmanship</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <h3 className="font-sans font-bold tracking-widest uppercase text-sm mb-4">Premium Fabrics</h3>
                <p className="text-sm text-muted-foreground">We source only the finest double-lined Italian fabrics, ensuring longevity, comfort, and a perfect fit.</p>
              </div>
              <div>
                <h3 className="font-sans font-bold tracking-widest uppercase text-sm mb-4">Ethical Production</h3>
                <p className="text-sm text-muted-foreground">Our pieces are handcrafted in small batches in Brazil, supporting local artisans and ethical labor practices.</p>
              </div>
              <div>
                <h3 className="font-sans font-bold tracking-widest uppercase text-sm mb-4">Timeless Design</h3>
                <p className="text-sm text-muted-foreground">We create investment pieces that transcend seasons, blending contemporary trends with classic elegance.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

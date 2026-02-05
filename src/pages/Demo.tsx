
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ThreeSixtyViewer } from '@/components/ThreeSixtyViewer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Layout, Camera, Layers } from 'lucide-react';

const mockSequence = [
  'https://images.unsplash.com/photo-1590650213165-c1fef80648c4?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1585145197082-dba093751931?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1544391496-1ca7c9765779?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1506223580648-267923485f76?auto=format&fit=crop&q=80&w=800',
];

export default function Demo() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16 md:mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-serif text-4xl md:text-6xl mb-6">Experience the <span className="gradient-gold-text">Innovation</span></h1>
              <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">
                Discover the exclusive features that make Nina Armend the ultimate destination for luxury Brazilian swimwear.
              </p>
            </motion.div>
          </div>

          <div className="space-y-32">
            {/* Feature 1: 360 Viewer */}
            <section className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-sans tracking-widest uppercase">
                  <Star className="h-3 w-3" /> Immersive Experience
                </div>
                <h2 className="font-serif text-3xl md:text-4xl">360° Product Viewer</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Experience every curve and detail of our premium fabrics with our immersive 360-degree viewer.
                  Designed to give you the confidence of an in-store experience from the comfort of your home.
                </p>
                <div className="pt-4">
                  <Button asChild variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5">
                    <Link to="/shop">Explore Collection</Link>
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="max-w-md mx-auto w-full"
              >
                <ThreeSixtyViewer images={mockSequence} />
              </motion.div>
            </section>

            {/* Feature 2: Fitting Room */}
            <section className="grid lg:grid-cols-2 gap-12 items-center lg:flex-row-reverse">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="order-2 lg:order-1 relative"
              >
                <div className="aspect-[4/5] bg-secondary/50 rounded-2xl overflow-hidden border border-border/50 shadow-2xl relative">
                  <img
                    src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800"
                    alt="Virtual Fitting Room Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-background/90 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-xl text-center max-w-xs">
                      <Camera className="h-8 w-8 text-primary mx-auto mb-4" />
                      <h3 className="font-serif text-lg mb-2">Virtual Fitting Room</h3>
                      <p className="text-xs text-muted-foreground mb-4">Upload your photo to see how our silhouettes celebrate your unique shape.</p>
                      <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Link to="/fitting-room">Try It Now</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6 order-1 lg:order-2"
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-sans tracking-widest uppercase">
                  <Camera className="h-3 w-3" /> AI-Powered
                </div>
                <h2 className="font-serif text-3xl md:text-4xl">Virtual Fitting Room</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Eliminate the guesswork of online shopping. Our AI-driven fitting room allows you to
                  virtually try on different styles and sizes, ensuring you find the perfect match for your silhouette.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Star className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>Privacy-focused photo processing</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Star className="h-3 w-3 text-emerald-500" />
                    </div>
                    <span>Accurate size recommendations</span>
                  </li>
                </ul>
              </motion.div>
            </section>

            {/* Feature 3: Mix & Match */}
            <section className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-sans tracking-widest uppercase">
                  <Layers className="h-3 w-3" /> Creative Freedom
                </div>
                <h2 className="font-serif text-3xl md:text-4xl">Mix & Match Builder</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your style is unique. Why settle for a pre-set pair? Our Mix & Match builder
                  gives you the freedom to pair any top with any bottom in our collection.
                  Visualize your creations in real-time.
                </p>
                <div className="pt-4">
                  <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8">
                    <Link to="/mix-and-match">Start Building</Link>
                  </Button>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-card border border-border/50 rounded-2xl p-8 shadow-sm"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-[3/4] bg-secondary/50 rounded-lg overflow-hidden border border-border/30">
                     <img src="https://images.unsplash.com/photo-1590650213165-c1fef80648c4?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" alt="Top Preview" />
                  </div>
                  <div className="aspect-[3/4] bg-secondary/50 rounded-lg overflow-hidden border border-border/30">
                     <img src="https://images.unsplash.com/photo-1544391496-1ca7c9765779?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" alt="Bottom Preview" />
                  </div>
                </div>
                <div className="mt-6 flex justify-between items-center">
                   <div className="space-y-1">
                      <p className="text-xs font-sans uppercase tracking-widest text-muted-foreground">Perfect Pairing</p>
                      <h4 className="font-serif text-lg">Copacabana Gold Set</h4>
                   </div>
                   <div className="text-primary font-sans font-bold">$160.00</div>
                </div>
              </motion.div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

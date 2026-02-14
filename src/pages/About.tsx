
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import ninaVisionAboutImg from '@/assets/nina-vision-about.jpeg';

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
              We are an online luxury swimwear brand offering exotic crafted pieces made in Brazil, where swimwear fabrics set the standard. Our collections are thoughtfully selected to flatter every body type, blending refined silhouettes with high quality, eco-conscious fabrics.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center mb-32">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center md:text-left order-2 md:order-1"
            >
              <h2 className="font-serif text-3xl md:text-5xl mb-8">The Nina Armend Vision</h2>
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Nina Armend's vision is to explore the display of the body's beauty with pride and shamelessness. Nina Armend believes the human body is not meant to be hidden, but to be shown with grace. We represent strength that is earned through individuality.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex justify-center order-1 md:order-2"
            >
              <div className="aspect-square w-full max-w-[320px] lg:max-w-[420px] bg-secondary rounded-full overflow-hidden border-8 border-secondary/20 shadow-elegant relative group">
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <img
                  src={ninaVisionAboutImg}
                  alt="Nina Armend Vision"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center mb-32">
             <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:order-2 text-center md:text-left"
            >
              <h2 className="font-serif text-3xl md:text-5xl mb-4">Meet the Founder</h2>
              <p className="text-primary font-sans tracking-[0.3em] uppercase text-[10px] md:text-xs font-bold mb-10">Lydia — Founder & Owner</p>
              <div className="space-y-8">
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Lydia founded Nina Armend with a clear vision: to bring the authentic soul of Brazilian beach culture to the global luxury market. Her background in fashion design and her deep connection to the coastal lifestyle drive the brand's creative direction.
                </p>
                <p className="text-foreground leading-relaxed italic border-l-2 border-primary/40 pl-8 py-4 bg-secondary/10 rounded-r-xl text-lg">
                  "Nina Armend is a tribute to the confident, effortless elegance of the modern woman. We don't just make bikinis; we create memories of sun-kissed days and endless summers."
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:order-1 flex justify-center"
            >
              <div className="aspect-square w-full max-w-[320px] lg:max-w-[420px] bg-secondary rounded-full overflow-hidden border-8 border-secondary/20 shadow-elegant relative group">
                <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <img
                  src="/assets/lydia.jpeg"
                  alt="Lydia - Founder & Owner"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </motion.div>
          </div>

          <div className="bg-secondary/20 rounded-[3rem] p-12 md:p-24 text-center border border-primary/10 shadow-gold mb-20">
            <h2 className="font-serif text-3xl md:text-5xl mb-16">Uncompromising Craftsmanship</h2>
            <div className="grid md:grid-cols-3 gap-16">
              <div className="space-y-4">
                <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                </div>
                <h3 className="font-sans font-bold tracking-[0.2em] uppercase text-xs mb-4">Premium Fabrics</h3>
                <p className="text-muted-foreground leading-relaxed">We source only the finest double-lined Brazilian fabrics that set the industry standard, ensuring longevity, comfort, and a perfect fit.</p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                </div>
                <h3 className="font-sans font-bold tracking-[0.2em] uppercase text-xs mb-4">Ethical Production</h3>
                <p className="text-muted-foreground leading-relaxed">Our pieces are handcrafted in small batches in Brazil, supporting local artisans and ethical labor practices.</p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="h-2 w-2 bg-primary rounded-full" />
                </div>
                <h3 className="font-sans font-bold tracking-[0.2em] uppercase text-xs mb-4">Timeless Design</h3>
                <p className="text-muted-foreground leading-relaxed">We create investment pieces that transcend seasons, blending contemporary trends with classic elegance.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

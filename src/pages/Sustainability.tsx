
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Leaf, Recycle, Heart } from 'lucide-react';
import slowFashionImg from '@/assets/slow-fashion.jpeg';
import waterConservationImg from '@/assets/water-conservation.jpeg';
import ninaVisionImg from '@/assets/nina-vision.jpeg';

export default function Sustainability() {
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
            <h1 className="font-serif text-4xl md:text-6xl mb-6">Sustainability</h1>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              Our commitment to the planet is as deep as our love for the ocean.
              We believe luxury should never come at the cost of the environment.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: Leaf,
                title: "Eco-Conscious Fabrics",
                description: "We utilize high-quality, eco-conscious fabrics made in Brazil, where swimwear fabrics set the standard for the industry."
              },
              {
                icon: Recycle,
                title: "Conscious Packaging",
                description: "Our signature packaging is 100% recyclable and plastic-free, designed to be kept and reused."
              },
              {
                icon: Heart,
                title: "Ethical Manufacturing",
                description: "By producing in small batches in Brazil, we minimize waste and ensure fair wages for the artisans who craft our pieces."
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border/50 p-8 rounded-2xl text-center"
              >
                <item.icon className="h-10 w-10 text-primary mx-auto mb-6" />
                <h3 className="font-serif text-xl mb-4">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-3xl mb-8 text-center">Our Pillars of Responsibility</h2>
            <div className="space-y-12">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h3 className="font-serif text-2xl mb-4">Slow Fashion Philosophy</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We don't follow the fast-fashion calendar. Our collections are designed to be timeless
                    and durable, encouraging a "buy less, buy better" approach. By focusing on quality
                    over quantity, we reduce the overall environmental footprint of your wardrobe.
                  </p>
                </div>
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-secondary overflow-hidden mx-auto flex-shrink-0">
                  <img src={slowFashionImg} alt="Slow Fashion" className="w-full h-full object-cover object-center" style={{ objectPosition: '30% center' }} />
                </div>
              </div>

              <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                <div className="flex-1">
                  <h3 className="font-serif text-2xl mb-4">Water Conservation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The dyeing processes used by our fabric partners are designed to minimize water
                    consumption and eliminate toxic runoff, protecting the very oceans our swimwear
                    is meant to enjoy.
                  </p>
                </div>
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-secondary overflow-hidden mx-auto flex-shrink-0">
                  <img src={waterConservationImg} alt="Water Conservation" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h3 className="font-serif text-2xl mb-4">The Nina Armend Vision</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Our vision is rooted in celebrating natural beauty and the joy of living in harmony
                    with the world around us. Every piece we create is an invitation to embrace the sun,
                    the sea, and the confidence that comes from wearing something made with intention.
                  </p>
                </div>
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-secondary overflow-hidden mx-auto flex-shrink-0">
                  <img src={ninaVisionImg} alt="The Nina Armend Vision" className="w-full h-full object-cover" style={{ objectPosition: '65% center' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

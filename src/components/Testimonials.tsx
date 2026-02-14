import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useReviewStore } from '@/stores/reviewStore';
import { useMemo } from 'react';

export function Testimonials() {
  const { reviews } = useReviewStore();

  const testimonials = useMemo(() => {
    return reviews
      .filter(r => r.rating >= 4 && r.comment.length >= 20)
      .slice(0, 3)
      .map(r => ({
        name: r.userName,
        location: "Verified Buyer",
        text: r.comment,
        rating: r.rating,
      }));
  }, [reviews]);

  if (testimonials.length === 0) return null;

  return (
    <section className="py-24 bg-secondary/20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl mb-4">What Our Muse Says</h2>
          <p className="text-muted-foreground uppercase tracking-[0.2em] text-xs">Stories from the Inner Circle</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-background p-8 rounded-2xl border border-primary/10 shadow-sm relative"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />
              <div className="flex mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground italic mb-6 leading-relaxed">"{t.text}"</p>
              <div>
                <p className="font-sans font-bold text-sm uppercase tracking-tight">{t.name}</p>
                <p className="text-[10px] text-primary uppercase tracking-widest">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

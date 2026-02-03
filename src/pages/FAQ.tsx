
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I find my perfect size?",
    answer: "We recommend using our Virtual Fitting Room and taking our Size Quiz. Our pieces generally run true to size, but if you are between sizes, we suggest sizing up for better coverage or down for a cheekier look."
  },
  {
    question: "How should I care for my Nina Armend swimwear?",
    answer: "To ensure the longevity of your pieces, hand wash in cold water with mild detergent immediately after use. Avoid wringing or twisting. Lay flat to dry in the shade. Do not iron or bleach."
  },
  {
    question: "Where are your products made?",
    answer: "All Nina Armend swimwear is proudly handcrafted in Brazil using premium Italian fabrics. We work closely with small-scale manufacturers to ensure ethical production and exceptional quality."
  },
  {
    question: "Do you ship worldwide?",
    answer: "Yes, we ship to most countries globally. Shipping rates and delivery times vary depending on your location. Please refer to our Shipping page for more details."
  },
  {
    question: "Can I return an item if it doesn't fit?",
    answer: "Yes, we accept returns on unworn items with tags and hygiene liners attached within 14 days of receipt. Please see our Shipping & Returns page for full instructions."
  }
];

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <h1 className="font-serif text-4xl mb-12 text-center">Frequently Asked Questions</h1>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-serif text-lg">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <a href="/contact" className="text-primary hover:underline font-sans tracking-widest uppercase text-sm">Contact Our Concierge</a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

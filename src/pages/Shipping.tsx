
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Truck, RotateCcw, Globe } from 'lucide-react';

export default function Shipping() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h1 className="font-serif text-4xl mb-8 text-center">Shipping & Returns</h1>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Truck className="h-6 w-6 text-primary" />
                <h2 className="font-serif text-2xl">Shipping Policy</h2>
              </div>
              <p className="text-muted-foreground">We offer complimentary express shipping on all orders of 2 bikini sets or more. For other orders, a flat rate shipping fee applies.</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                <li>Processing time: 1-2 business days</li>
                <li>Domestic delivery: 2-4 business days</li>
                <li>International delivery: 5-8 business days</li>
              </ul>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <RotateCcw className="h-6 w-6 text-primary" />
                <h2 className="font-serif text-2xl">Returns & Exchanges</h2>
              </div>
              <p className="text-muted-foreground">We want you to love your Nina Armend pieces. If you're not completely satisfied, we accept returns within 14 days of delivery.</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                <li>Items must be unworn with original tags and hygiene liners intact</li>
                <li>Return shipping is the responsibility of the customer</li>
                <li>Exchanges are processed free of charge</li>
              </ul>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-2xl p-8 flex items-start gap-6">
            <Globe className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-serif text-xl mb-2">International Orders</h3>
              <p className="text-sm text-muted-foreground">Please note that international orders may be subject to import duties and taxes, which are the responsibility of the recipient. These vary by country and are not controlled by Nina Armend.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

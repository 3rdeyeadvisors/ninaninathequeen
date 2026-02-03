
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h1 className="font-serif text-4xl mb-8">Terms of Service</h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <section>
              <h2 className="text-foreground font-serif text-2xl mb-4">1. Acceptance of Terms</h2>
              <p>By accessing and using the Nina Armend website, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our site.</p>
            </section>
            <section>
              <h2 className="text-foreground font-serif text-2xl mb-4">2. Product Information</h2>
              <p>We make every effort to display as accurately as possible the colors and images of our products. However, we cannot guarantee that your computer monitor's display of any color will be accurate.</p>
            </section>
            <section>
              <h2 className="text-foreground font-serif text-2xl mb-4">3. Purchases and Payment</h2>
              <p>All prices are in USD. We reserve the right to refuse any order you place with us. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the e-mail provided at the time the order was made.</p>
            </section>
            <section>
              <h2 className="text-foreground font-serif text-2xl mb-4">4. Shipping and Returns</h2>
              <p>Please refer to our Shipping & Returns page for detailed information on our policies regarding the delivery and return of Nina Armend products.</p>
            </section>
            <p className="mt-12 text-xs">Last updated: May 2025</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

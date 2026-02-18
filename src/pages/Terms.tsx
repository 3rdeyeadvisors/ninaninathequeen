
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
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
            <section>
              <h2 className="text-foreground font-serif text-2xl mb-4">5. Analytics and Personalization</h2>
              <p>For authenticated users, we may collect browsing data such as product page views to improve our store experience and provide personalized offers. This data is used solely to enhance your shopping experience and is never sold to third parties. By creating an account and using our site, you consent to this data collection as described in our Privacy Policy.</p>
            </section>
            <section>
              <h2 className="text-foreground font-serif text-2xl mb-4">6. Loyalty Points & Discounts</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Points are earned through purchases (1 point per $1 spent) and other activities as described in your account dashboard.</li>
                <li>Every 500 points earned can be redeemed for a $10 discount, which will be automatically available to be applied at checkout.</li>
                <li>Birthday Month Discount: Registered customers are eligible for a $5 discount on one order placed during their registered birth month.</li>
                <li>Discounts cannot be stacked — only one discount applies per order. If multiple discounts are available, loyalty points redemption will take priority.</li>
                <li>Points have no cash value and are non-transferable.</li>
                <li>Nina Armend reserves the right to modify or discontinue the loyalty program at any time without prior notice.</li>
              </ul>
            </section>
            <p className="mt-12 text-xs">Last updated: February 2026</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

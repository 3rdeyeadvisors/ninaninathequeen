
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h1 className="font-serif text-4xl mb-8">Privacy Policy</h1>
          <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
            <p>At Nina Armend, we value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and safeguard your data.</p>
            <section>
              <h2 className="text-foreground font-serif text-2xl mb-4">Information We Collect</h2>
              <p>We collect information that you provide directly to us when you make a purchase, sign up for our newsletter, or contact our customer support team. This may include your name, email address, shipping address, and payment information.</p>
            </section>
            <section>
              <h2 className="text-foreground font-serif text-2xl mb-4">How We Use Your Information</h2>
              <p>We use your information to process your orders, communicate with you about your purchase, and provide you with updates about our collections and special offers if you have opted in to receive them.</p>
            </section>
            <section>
              <h2 className="text-foreground font-serif text-2xl mb-4">Data Security</h2>
              <p>We implement a variety of security measures to maintain the safety of your personal information. Your personal data is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.</p>
            </section>
            <p className="mt-12 text-xs">Last updated: May 2025</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

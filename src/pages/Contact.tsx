
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/stores/adminStore';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function Contact() {
  const { settings } = useAdminStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (name.length > 100 || email.length > 255 || message.length > 2000) {
      toast.error("One or more fields exceed the maximum length.");
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'contact_form',
          data: { name: name.trim(), email: email.trim(), message: message.trim() },
        },
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Failed to send');

      toast.success("Thank you for your message. Our concierge will be in touch shortly.");
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      console.error('Contact form error:', err);
      toast.error("We couldn't send your message. Please try again or email us directly.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-4xl md:text-5xl mb-12 text-center">Contact Us</h1>

            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <h2 className="font-serif text-2xl mb-6">Get in Touch</h2>
                <p className="text-muted-foreground mb-8">Our customer concierge team is available to assist you with sizing, styling, and order inquiries.</p>

                <div className="space-y-6">
                  {settings.contactEmail && (
                    <div className="flex items-center gap-4">
                      <div className="bg-secondary p-3 rounded-full">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Email</p>
                        <p>{settings.contactEmail}</p>
                      </div>
                    </div>
                  )}
                  {settings.contactPhone && (
                    <div className="flex items-center gap-4">
                      <div className="bg-secondary p-3 rounded-full">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Customer Support</p>
                        <p>{settings.contactPhone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="bg-secondary p-3 rounded-full">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-sans tracking-widest uppercase text-muted-foreground">Atelier</p>
                      <p>Leblon, Rio de Janeiro, Brazil</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-sans tracking-widest uppercase">Name</label>
                    <Input
                      placeholder="Your full name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={100}
                      disabled={isSending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-sans tracking-widest uppercase">Email</label>
                    <Input
                      type="email"
                      placeholder="Your email address"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={255}
                      disabled={isSending}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-sans tracking-widest uppercase">Message</label>
                    <Textarea
                      placeholder="How can we help you?"
                      className="min-h-[150px]"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={2000}
                      disabled={isSending}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground tracking-widest uppercase"
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
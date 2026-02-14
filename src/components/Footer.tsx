import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Facebook, Mail, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAdminStore } from '@/stores/adminStore';

const footerLinks = {
  shop: [
    { name: 'All Products', href: '/shop' },
    { name: 'Tops', href: '/shop?category=tops' },
    { name: 'Bottoms', href: '/shop?category=bottoms' },
    { name: 'One-Pieces', href: '/shop?category=one-pieces' },
  ],
  help: [
    { name: 'Size Guide & Quiz', href: '/size-quiz' },
    { name: 'Shipping & Returns', href: '/shipping' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact Us', href: '/contact' },
  ],
  company: [
    { name: 'Our Story', href: '/about' },
    { name: 'Sustainability', href: '/sustainability' },
  ],
};

export function Footer() {
  const { settings } = useAdminStore();

  return (
    <footer className="bg-card border-t border-border">
      {/* Newsletter section */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 md:px-8 py-16">
          <div className="max-w-xl mx-auto text-center">
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl md:text-4xl mb-4"
            >
              Join the <span className="gradient-gold-text">Inner Circle</span>
            </motion.h3>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground mb-8"
            >
              Subscribe for exclusive access to new collections, special offers, and insider updates.
            </motion.p>
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                const email = (e.currentTarget.elements[0] as HTMLInputElement).value;
                if (email) {
                  toast.success('Welcome to the Inner Circle!', {
                    description: "You've been successfully subscribed to our newsletter."
                  });
                  (e.currentTarget.elements[0] as HTMLInputElement).value = '';
                }
              }}
            >
              <Input
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 bg-background border-border focus:border-primary"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans tracking-wider px-8">
                Subscribe
              </Button>
            </motion.form>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="container mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <h2 className="font-serif text-2xl tracking-[0.2em] gradient-gold-text mb-4">
              NINA ARMEND
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-xs">
              Online luxury swimwear brand offering exotic crafted pieces made in Brazil.
              Collections designed to flatter every body type with high-quality, eco-conscious fabrics.
            </p>
            <div className="flex items-center gap-3">
              {settings.instagramUrl && (
                <Button variant="ghost" size="icon" className="hover:text-primary" asChild>
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {settings.facebookUrl && (
                <Button variant="ghost" size="icon" className="hover:text-primary" asChild>
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {settings.tiktokUrl && (
                <Button variant="ghost" size="icon" className="hover:text-primary" asChild>
                  <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {settings.contactEmail && (
                <Button variant="ghost" size="icon" className="hover:text-primary" asChild>
                  <a href={`mailto:${settings.contactEmail}`}>
                    <Mail className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-sans text-sm tracking-wider uppercase mb-4">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h4 className="font-sans text-sm tracking-wider uppercase mb-4">Help</h4>
            <ul className="space-y-3">
              {footerLinks.help.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-sans text-sm tracking-wider uppercase mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Nina Armend. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

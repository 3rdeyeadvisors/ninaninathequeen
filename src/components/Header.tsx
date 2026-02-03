import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { CartDrawer } from './CartDrawer';
import { Menu, X, Search, User, Heart } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const navLinks = [
  { name: 'Shop All', href: '/shop' },
  { name: 'Bikinis', href: '/shop?category=bikinis' },
  { name: 'One-Pieces', href: '/shop?category=one-pieces' },
  { name: 'Cover-ups', href: '/shop?category=cover-ups' },
  { name: 'Accessories', href: '/shop?category=accessories' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <nav className="container mx-auto px-4 md:px-8">
        <div className="flex items-center h-16 md:h-20">
          {/* Left section - Mobile menu / Desktop nav */}
          <div className="flex items-center gap-8 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Desktop navigation - left */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.slice(0, 3).map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-sans tracking-wider text-foreground/80 hover:text-primary transition-colors uppercase"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Logo - center with flex-1 to respect boundaries */}
          <div className="flex-1 flex justify-center min-w-0 px-2">
            <Link to="/" className="text-center">
              <Logo />
            </Link>
          </div>

          {/* Right section - Desktop nav / Icons */}
          <div className="flex items-center gap-8 flex-shrink-0">
            {/* Desktop navigation - right */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.slice(3).map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-sm font-sans tracking-wider text-foreground/80 hover:text-primary transition-colors uppercase"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Search className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <User className="h-5 w-5" />
              </Button>
              <CartDrawer />
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-border/30"
            >
              <div className="py-6 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block text-lg font-serif tracking-wider text-foreground/80 hover:text-primary transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="flex items-center gap-4 pt-4 border-t border-border/30">
                  <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Heart className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

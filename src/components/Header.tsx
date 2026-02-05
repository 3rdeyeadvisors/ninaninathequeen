import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { CartDrawer } from './CartDrawer';
import { AnnouncementBar } from './AnnouncementBar';
import { Menu, X, Search, User, Heart, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useAuthStore, ADMIN_EMAIL } from '@/stores/authStore';
import { Input } from '@/components/ui/input';

const navLinks = [
  { name: 'Shop All', href: '/shop' },
  { name: 'Mix & Match', href: '/mix-and-match' },
  { name: 'Fitting Room', href: '/fitting-room' },
  { name: 'Bikinis', href: '/shop?category=bikinis' },
  { name: 'One-Pieces', href: '/shop?category=one-pieces' },
  { name: 'Cover-ups', href: '/shop?category=cover-ups' },
  { name: 'Accessories', href: '/shop?category=accessories' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const wishlistItems = useWishlistStore(state => state.items);
  const { user, isAuthenticated } = useAuthStore();

  const isAdmin = isAuthenticated && user?.email === ADMIN_EMAIL;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <AnnouncementBar />
      <nav className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16 md:h-24 gap-4">
          {/* Left section - Mobile menu / Desktop nav */}
          <div className="flex items-center gap-4 md:gap-8">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Desktop navigation - left */}
            <div className="hidden lg:flex items-center gap-6 pr-4">
              {navLinks.slice(0, 3).map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-[10px] font-sans tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors uppercase whitespace-nowrap"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Logo - Perfect Center */}
          <div className="flex justify-center z-10 mx-4 md:mx-8">
            <Link to="/" className="flex flex-col items-center">
              <Logo />
            </Link>
          </div>

          {/* Right section - Icons */}
          <div className="flex items-center justify-end gap-2 md:gap-4 lg:gap-6">
            {/* Desktop navigation - right */}
            <div className="hidden xl:flex items-center gap-6 pl-4">
              {navLinks.slice(3).map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-[10px] font-sans tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors uppercase whitespace-nowrap"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
              >
                {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>

              <Link to="/wishlist">
                <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex relative">
                  <Heart className="h-4 w-4 md:h-5 md:w-5" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm">
                      {wishlistItems.length}
                    </span>
                  )}
                </Button>
              </Link>
              <Link to="/account">
                <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex">
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>

              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="hidden lg:flex gap-2 border-primary/20 text-primary hover:bg-primary/5 ml-2 font-sans text-[10px] uppercase tracking-widest">
                    <LayoutDashboard className="h-3 w-3" />
                    Admin Dashboard
                  </Button>
                </Link>
              )}

              <CartDrawer />
            </div>
          </div>
        </div>

        {/* Search Bar - Slide Down */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-background/95 backdrop-blur-md border-t border-border/30"
            >
              <div className="container mx-auto px-4 md:px-8 py-4">
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Search our collection..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 rounded-full bg-secondary/30 border-primary/10 focus:ring-primary font-sans text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
                    onClick={() => setSearchOpen(false)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-4 py-2 bg-primary/5 text-primary rounded-lg border border-primary/10 mb-4"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="text-lg font-serif">Admin Dashboard</span>
                  </Link>
                )}

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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSearchOpen(true);
                    }}
                    aria-label="Open search"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="icon" className="relative">
                      <Heart className="h-5 w-5" />
                      {wishlistItems.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {wishlistItems.length}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Link to="/account" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

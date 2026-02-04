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
        <div className="grid grid-cols-3 items-center h-16 md:h-24">
          {/* Left section - Mobile menu / Desktop nav */}
          <div className="flex items-center gap-4 md:gap-8">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Desktop navigation - left */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.slice(0, 2).map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-xs font-sans tracking-widest text-foreground/80 hover:text-primary transition-colors uppercase whitespace-nowrap"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Logo - Perfect Center */}
          <div className="flex justify-center">
            <Link to="/" className="flex flex-col items-center">
              <Logo />
            </Link>
          </div>

          {/* Right section - Desktop nav / Icons */}
          <div className="flex items-center justify-end gap-2 md:gap-4 lg:gap-8">
            {/* Desktop navigation - right */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.slice(2, 4).map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-xs font-sans tracking-widest text-foreground/80 hover:text-primary transition-colors uppercase whitespace-nowrap"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              <div className="relative flex items-center">
                <AnimatePresence>
                  {searchOpen && (
                    <motion.form
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 200, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      onSubmit={handleSearch}
                      className="absolute right-full mr-2"
                    >
                      <Input
                        autoFocus
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 rounded-full bg-background/50 backdrop-blur-sm border-primary/20"
                      />
                    </motion.form>
                  )}
                </AnimatePresence>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSearchOpen(!searchOpen)}
                >
                  {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4 md:h-5 md:w-5" />}
                </Button>
              </div>

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
                  <Button variant="ghost" size="icon">
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Heart className="h-5 w-5" />
                  </Button>
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

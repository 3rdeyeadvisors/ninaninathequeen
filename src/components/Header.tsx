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
import { fetchProducts, type ShopifyProduct } from '@/lib/shopify';
import { useEffect } from 'react';

const navLinks = [
  { name: 'Shop All', href: '/shop' },
  { name: 'Mix & Match', href: '/mix-and-match' },
  { name: 'Fitting Room', href: '/fitting-room' },
  { name: 'Bikinis', href: '/shop?category=bikinis' },
  { name: 'One-Pieces', href: '/shop?category=one-pieces' },
  { name: 'Cover-ups', href: '/shop?category=cover-ups' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ShopifyProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const wishlistItems = useWishlistStore(state => state.items);
  const { user, isAuthenticated } = useAuthStore();

  const isAdmin = isAuthenticated && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await fetchProducts(5, searchQuery);
          setSuggestions(results);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      <nav className="mx-auto px-4 md:px-8 relative h-16 md:h-24 max-w-[1920px]">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden absolute left-4 top-1/2 -translate-y-1/2 z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Desktop Navigation - Flex Container */}
        <div className="hidden lg:flex items-center justify-between h-full w-full">

          {/* Left Navigation Group */}
          <div className="flex items-center gap-3 xl:gap-6 2xl:gap-10 basis-0 grow justify-start overflow-hidden">
            {navLinks.slice(0, 3).map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className="text-[8px] xl:text-[9px] 2xl:text-[10px] font-sans tracking-[0.1em] xl:tracking-[0.2em] 2xl:tracking-[0.3em] text-foreground/70 hover:text-primary transition-colors uppercase whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Logo Center Placeholder - Keeps the gap for the absolute logo */}
          <div className="w-[140px] xl:w-[240px] 2xl:w-[380px] shrink-0" />

          {/* Right Navigation + Icons Group */}
          <div className="flex items-center justify-end gap-2 xl:gap-4 2xl:gap-8 basis-0 grow overflow-hidden">
            {/* Right Nav Links */}
            <div className="flex items-center gap-3 xl:gap-6 2xl:gap-8 mr-1 xl:mr-4">
              {navLinks.slice(3).map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-[9px] 2xl:text-[10px] font-sans tracking-[0.15em] xl:tracking-[0.2em] 2xl:tracking-[0.3em] text-foreground/70 hover:text-primary transition-colors uppercase whitespace-nowrap"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Icons + Admin Dashboard Button */}
            <div className="flex items-center gap-0.5 xl:gap-1 2xl:gap-2 shrink-0">
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="flex gap-2 border-primary/20 text-primary hover:bg-primary/5 font-sans text-[9px] 2xl:text-[10px] uppercase tracking-widest shadow-sm px-2 2xl:px-4 h-9">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden 2xl:inline">Admin Dashboard</span>
                    <span className="hidden min-[1440px]:inline 2xl:hidden">Admin</span>
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 xl:h-10 xl:w-10 transition-colors"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Toggle search"
              >
                {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </Button>

              <Link to="/wishlist">
                <Button variant="ghost" size="icon" className="h-9 w-9 xl:h-10 xl:w-10 hidden sm:flex relative transition-colors">
                  <Heart className="h-5 w-5 text-foreground" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-sm ring-1 ring-background">
                      {wishlistItems.length}
                    </span>
                  )}
                </Button>
              </Link>

              <Link to="/account">
                <Button variant="ghost" size="icon" className="h-9 w-9 xl:h-10 xl:w-10 hidden sm:flex transition-colors">
                  <User className="h-5 w-5" />
                </Button>
              </Link>

              <div className="pl-1">
                <CartDrawer />
              </div>
            </div>
          </div>
        </div>

        {/* Logo - Guaranteed Perfect Center via Absolute Positioning */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden lg:block">
          <Link to="/" className="flex flex-col items-center pointer-events-auto scale-[0.65] xl:scale-[0.85] 2xl:scale-100 transition-all duration-300">
            <Logo />
          </Link>
        </div>

        {/* Mobile Logo & Cart (for < lg) */}
        <div className="lg:hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link to="/" className="flex flex-col items-center scale-75">
            <Logo />
          </Link>
        </div>

        <div className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search className="h-5 w-5" />
          </Button>
          <CartDrawer />
        </div>

        {/* Search Bar - Slide Down */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
              animate={{ height: 'auto', opacity: 1, transitionEnd: { overflow: 'visible' } }}
              exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
              className="bg-background/95 backdrop-blur-md border-t border-border/30"
            >
              <div className="container mx-auto px-4 md:px-8 py-4">
                <div className="relative max-w-2xl mx-auto">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="Search our collection..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 rounded-full bg-secondary/30 border-primary/10 focus:ring-primary font-sans text-sm"
                    />
                    {isSearching && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    )}
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

                  {/* Search Suggestions Dropdown */}
                  <AnimatePresence>
                    {suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-[60] backdrop-blur-xl"
                      >
                        <div className="p-2">
                          <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground px-4 py-2">Suggested Products</p>
                          {suggestions.map((product) => (
                            <Link
                              key={product.node.id}
                              to={`/product/${product.node.handle}`}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-4 p-3 hover:bg-primary/5 rounded-xl transition-colors group"
                            >
                              <div className="h-12 w-10 shrink-0 overflow-hidden rounded-md border border-border/50">
                                <img
                                  src={product.node.images.edges[0]?.node.url}
                                  alt={product.node.title}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-sans font-medium truncate group-hover:text-primary transition-colors">
                                  {product.node.title}
                                </h4>
                                <p className="text-xs text-muted-foreground font-serif">
                                  {product.node.priceRange.minVariantPrice.currencyCode} {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                                </p>
                              </div>
                            </Link>
                          ))}
                          <div className="border-t border-border/30 mt-2 p-2">
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-xs font-sans text-primary hover:bg-primary/5"
                              onClick={handleSearch}
                            >
                              View all results for "{searchQuery}"
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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

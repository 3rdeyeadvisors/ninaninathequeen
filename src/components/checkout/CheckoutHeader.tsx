import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { ShoppingBag } from 'lucide-react';

export function CheckoutHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] glass border-b border-border/30">
      <nav className="mx-auto px-4 md:px-8 relative h-16 md:h-20 max-w-[1920px] flex items-center justify-between">
        <div className="flex-1">
          <Link
            to="/shop"
            className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors font-sans"
          >
            <ShoppingBag className="h-4 w-4" />
            Back to bag
          </Link>
          <Link to="/shop" className="md:hidden">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link to="/" className="scale-75 md:scale-90 transition-transform duration-300 origin-center overflow-visible">
            <Logo />
          </Link>
        </div>

        <div className="flex-1 flex justify-end">
          {/* Empty div to maintain centered logo */}
        </div>
      </nav>
    </header>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Settings, Store, Users, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Keys that store the last count the admin actually SAW (i.e. visited that page)
const SEEN_KEYS: Record<string, string> = {
  '/admin/orders': 'admin_seen_pending_orders',
  '/admin/customers': 'admin_seen_waitlist',
};

export function AdminSidebar() {
  const location = useLocation();
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});
  const lastMarkedPath = useRef<string>('');

  useEffect(() => {
    const fetchAndMark = async () => {
      const [ordersRes, waitlistRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('waitlist').select('id', { count: 'exact', head: true }),
      ]);

      const counts: Record<string, number> = {
        '/admin/orders': ordersRes.count || 0,
        '/admin/customers': waitlistRes.count || 0,
      };

      const path = location.pathname;

      // Mark the current page as fully seen — persist to localStorage AND sessionStorage
      // so it survives navigation but resets correctly after logout/login
      const seenKey = SEEN_KEYS[path];
      if (seenKey && lastMarkedPath.current !== path) {
        lastMarkedPath.current = path;
        const currentCount = counts[path] || 0;
        localStorage.setItem(seenKey, String(currentCount));
        sessionStorage.setItem(seenKey, String(currentCount));
      }

      const badges: Record<string, number> = {};
      for (const [p, key] of Object.entries(SEEN_KEYS)) {
        if (p === path) {
          // Always zero on the current page — admin is looking at it right now
          badges[p] = 0;
        } else {
          // Use sessionStorage first (resets on logout), fall back to localStorage
          const seenRaw = sessionStorage.getItem(key) ?? localStorage.getItem(key) ?? '0';
          const seen = parseInt(seenRaw, 10);
          badges[p] = Math.max(0, (counts[p] || 0) - seen);
        }
      }

      setBadgeCounts(badges);
    };

    fetchAndMark();
  }, [location.pathname]);

  // Clear all seen counts from sessionStorage when admin logs out
  // so fresh login shows accurate unseen badge counts
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        Object.values(SEEN_KEYS).forEach(key => sessionStorage.removeItem(key));
      }
      if (event === 'SIGNED_IN') {
        // On fresh login, clear session seen counts so badges reflect reality
        Object.values(SEEN_KEYS).forEach(key => sessionStorage.removeItem(key));
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/pos', label: 'Point of Sale', icon: CreditCard },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="w-full flex items-center gap-2 sm:gap-4 mb-8 md:mb-10 p-1.5 sm:p-2.5 bg-background/60 backdrop-blur-md rounded-xl sm:rounded-2xl border border-primary/10 shadow-lg overflow-x-auto no-scrollbar">
      <div className="hidden xl:block px-6 py-3 mr-4 border-r border-primary/10 shrink-0">
        <div className="flex flex-col">
          <p className="text-[10px] font-sans tracking-[0.4em] uppercase text-primary font-black">Admin</p>
          <p className="text-[8px] font-sans tracking-[0.2em] uppercase text-muted-foreground/60">Management</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          const count = badgeCounts[link.href] || 0;

          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "relative flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 font-sans text-[9px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground shadow-gold font-bold scale-105"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary hover:scale-105"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isActive ? "text-primary-foreground" : "text-muted-foreground/70")} />
              <span>{link.label}</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1 shadow-md border-2 border-background">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="ml-auto pr-4 hidden lg:block">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-primary transition-all font-sans text-[10px] uppercase tracking-widest group"
        >
          <Store className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
          <span>Back to Store</span>
        </Link>
      </div>
    </nav>
  );
}


import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Settings, Store, Users, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const location = useLocation();

  const links = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Package },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/pos', label: 'POS System', icon: CreditCard },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="w-full flex flex-wrap items-center gap-2 mb-8 p-1.5 bg-background/50 backdrop-blur-sm rounded-2xl border border-primary/10 shadow-sm">
      <div className="hidden lg:block px-4 py-2 mr-2 border-r border-border/30">
        <p className="text-[9px] font-sans tracking-[0.3em] uppercase text-primary font-bold">Admin Portal</p>
      </div>

      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;

          return (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl transition-all duration-300 font-sans text-[10px] uppercase tracking-[0.15em]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg font-bold"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="ml-auto pr-2 hidden md:block">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-primary transition-all font-sans text-[9px] uppercase tracking-widest group"
        >
          <Store className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
          <span>Back to Store</span>
        </Link>
      </div>
    </nav>
  );
}

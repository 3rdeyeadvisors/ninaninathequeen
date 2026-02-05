
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
    { href: '/admin/pos', label: 'Point of Sale', icon: CreditCard },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-full xl:w-72 space-y-2 shrink-0">
      <div className="px-4 py-2 mb-2">
        <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-muted-foreground/60">Admin Portal</p>
      </div>

      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.href;

        return (
          <Link
            key={link.href}
            to={link.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-sans text-sm",
              isActive
                ? "bg-primary text-primary-foreground shadow-md font-medium"
                : "text-muted-foreground hover:bg-card hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
            <span>{link.label}</span>
          </Link>
        );
      })}

      <div className="pt-4 mt-4 border-t border-border/30">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:bg-card hover:text-primary rounded-lg transition-all font-sans text-sm"
        >
          <Store className="h-5 w-5" />
          <span>View Store</span>
        </Link>
      </div>
    </aside>
  );
}

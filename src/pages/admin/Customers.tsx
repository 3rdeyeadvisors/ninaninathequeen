
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Search, User, Mail, DollarSign, ShoppingBag } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdminStore } from '@/stores/adminStore';
import { useState, useMemo } from 'react';

export default function AdminCustomers() {
  const { customers } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">
          <AdminSidebar />

          {/* Main Content */}
          <main className="flex-1 space-y-8 bg-card p-8 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="font-serif text-3xl">Customer Audience</h1>
              <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                <p className="text-[10px] font-sans uppercase tracking-widest text-primary font-bold">Total Audience</p>
                <p className="font-serif text-2xl">{customers.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-background border rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full font-sans"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Customer</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Email</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Orders</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Total Spent</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center font-sans text-muted-foreground">
                        No customers found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium font-sans text-sm">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{customer.email}</TableCell>
                      <TableCell className="font-sans text-sm">{customer.orderCount}</TableCell>
                      <TableCell className="font-sans text-sm font-medium">${parseFloat(customer.totalSpent).toFixed(2)}</TableCell>
                      <TableCell className="font-sans text-xs text-muted-foreground">{customer.joinDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="p-6 bg-gradient-to-br from-background to-secondary/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h3 className="font-sans text-[10px] uppercase tracking-widest font-bold">Avg. Life Value</h3>
                </div>
                <p className="font-serif text-2xl">$425.50</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-background to-secondary/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-sans text-[10px] uppercase tracking-widest font-bold">Repeat Purchase Rate</h3>
                </div>
                <p className="font-serif text-2xl">64%</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-background to-secondary/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Mail className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-sans text-[10px] uppercase tracking-widest font-bold">Newsletter Subs</h3>
                </div>
                <p className="font-serif text-2xl">892</p>
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, Mail, DollarSign, ShoppingBag, MapPin, Phone, Calendar, Award, Shield, Trash2, UserPlus, MoreVertical } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdminStore, type AdminCustomer as Customer } from '@/stores/adminStore';
import { useAuthStore, ADMIN_EMAIL } from '@/stores/authStore';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCustomers() {
  const { customers, deleteCustomer, addCustomer, _hasHydrated } = useAdminStore();
  const { user, users, updateUserRole, deleteAccount, addUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('User');

  const isOwner = user?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const getCustomerRole = (email: string) => {
    const authUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    return authUser?.role || 'Customer';
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  // Show loading skeleton while data is being restored from storage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-secondary/20">
        <Header />
        <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-8 lg:gap-12">
            <AdminSidebar />
            <main className="flex-1 space-y-8 bg-card p-4 sm:p-8 rounded-2xl border border-border/50 shadow-sm">
              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-32 md:pt-40 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-8 lg:gap-12">
          <AdminSidebar />

          <main className="flex-1 space-y-8 bg-card p-4 sm:p-8 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h1 className="font-serif text-3xl">Customer Audience</h1>
                <p className="text-muted-foreground text-xs font-sans">Manage your store's users, roles, and administrative access.</p>
              </div>
              <div className="flex items-center gap-4">
                {isOwner && (
                  <Button
                    onClick={() => setIsInviteDialogOpen(true)}
                    className="bg-primary hover:scale-105 transition-transform font-sans text-[10px] uppercase tracking-widest h-10 px-6"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                )}
                <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 hidden sm:block">
                  <p className="text-[10px] font-sans uppercase tracking-widest text-primary font-bold">Total Audience</p>
                  <p className="font-serif text-2xl">{customers.length}</p>
                </div>
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
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Customer</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Email</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Role</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Orders</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Total Spent</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center font-sans text-muted-foreground">
                        No customers found matching your search.
                      </TableCell>
                    </TableRow>
                  ) : filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors group"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium font-sans text-sm">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-sans text-sm text-muted-foreground">{customer.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-sans text-[10px] uppercase tracking-widest border-primary/20 text-primary">
                          {getCustomerRole(customer.email)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-sans text-sm">{customer.orderCount}</TableCell>
                      <TableCell className="font-sans text-sm font-medium">${parseFloat(customer.totalSpent).toFixed(2)}</TableCell>
                      <TableCell className="font-sans text-xs text-muted-foreground">{customer.joinDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
              <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-primary/20">
                {selectedCustomer && (
                  <div className="flex flex-col">
                    <div className="bg-primary/5 p-8 border-b border-primary/10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <User className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h2 className="font-serif text-2xl">{selectedCustomer.name}</h2>
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                              <Mail className="h-3 w-3" /> {selectedCustomer.email}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-primary text-primary-foreground font-sans text-[10px] uppercase tracking-widest px-3 py-1">
                          {parseFloat(selectedCustomer.totalSpent) > 1000 ? 'VIP Member' : 'Loyal Customer'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-primary/5">
                          <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Total Spent</p>
                          <p className="font-serif text-xl font-bold text-primary">${parseFloat(selectedCustomer.totalSpent).toFixed(2)}</p>
                        </div>
                        <div className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-primary/5">
                          <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Orders</p>
                          <p className="font-serif text-xl font-bold">{selectedCustomer.orderCount}</p>
                        </div>
                        <div className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-primary/5">
                          <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Loyalty Tier</p>
                          <div className="flex items-center gap-1 text-primary">
                            <Award className="h-4 w-4" />
                            <span className="font-serif text-lg font-bold">Gold</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-muted-foreground border-b pb-2">Customer Info</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                              <MapPin className="h-4 w-4 text-primary/60" />
                              <span className="text-muted-foreground">Rio de Janeiro, Brazil</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <Phone className="h-4 w-4 text-primary/60" />
                              <span className="text-muted-foreground">+55 21 9999-9999</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <Calendar className="h-4 w-4 text-primary/60" />
                              <span className="text-muted-foreground italic text-xs">Joined {selectedCustomer.joinDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-muted-foreground border-b pb-2">Preferences</h3>
                          <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="font-sans text-[10px] uppercase tracking-wider">Size: M</Badge>
                          <Badge variant="secondary" className="font-sans text-[10px] uppercase tracking-wider">Bikinis</Badge>
                          <Badge variant="secondary" className="font-sans text-[10px] uppercase tracking-wider">Eco-Conscious</Badge>
                          </div>
                        </div>
                      </div>

                      {isOwner && (
                        <div className="space-y-6 pt-2">
                          <div className="space-y-4">
                            <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-muted-foreground border-b pb-2">Administrative Controls</h3>
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border/50">
                                <div className="flex items-center gap-3">
                                  <Shield className="h-4 w-4 text-primary" />
                                  <div>
                                    <p className="text-[11px] font-sans font-bold uppercase tracking-wider">Account Role</p>
                                    <p className="text-[10px] text-muted-foreground font-sans">Grant manager or admin privileges</p>
                                  </div>
                                </div>
                                <select
                                  className="bg-background border rounded-lg px-3 py-1.5 text-xs font-sans outline-none focus:ring-1 focus:ring-primary"
                                  value={getCustomerRole(selectedCustomer.email)}
                                  onChange={(e) => {
                                    updateUserRole(selectedCustomer.email, e.target.value);
                                    // Refresh the UI by forcing a re-render or notification
                                  }}
                                >
                                  <option value="Customer">Customer</option>
                                  <option value="Manager">Manager</option>
                                  <option value="Admin">Admin</option>
                                  <option value="Founder & Owner">Founder & Owner</option>
                                </select>
                              </div>

                              <Button
                                variant="destructive"
                                className="w-full font-sans text-[10px] uppercase tracking-widest h-11 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border-red-200"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete the profile for ${selectedCustomer.name}? This action cannot be undone.`)) {
                                    deleteAccount(selectedCustomer.email);
                                    deleteCustomer(selectedCustomer.id);
                                    setSelectedCustomer(null);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Profile
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 flex justify-between gap-4">
                         <Button variant="outline" className="flex-1 font-sans text-[10px] uppercase tracking-widest h-11">
                           View History
                         </Button>
                         <Button className="flex-1 bg-primary font-sans text-[10px] uppercase tracking-widest h-11">
                           Send Email
                         </Button>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Invite Staff Dialog */}
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogContent className="sm:max-w-[450px] p-8 border-primary/20">
                <DialogHeader className="space-y-3 mb-6">
                  <DialogTitle className="font-serif text-2xl text-center">Add Store Staff</DialogTitle>
                  <p className="text-center text-muted-foreground text-sm font-sans">
                    Create a new administrative account for your team members.
                  </p>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans uppercase tracking-widest font-bold text-muted-foreground ml-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Maria Oliveira"
                      className="w-full bg-secondary/30 border rounded-xl px-4 py-3 text-sm font-sans outline-none focus:ring-1 focus:ring-primary"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans uppercase tracking-widest font-bold text-muted-foreground ml-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="maria@ninaarmend.co.site"
                      className="w-full bg-secondary/30 border rounded-xl px-4 py-3 text-sm font-sans outline-none focus:ring-1 focus:ring-primary"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-sans uppercase tracking-widest font-bold text-muted-foreground ml-1">Role Type</label>
                    <select
                      className="w-full bg-secondary/30 border rounded-xl px-4 py-3 text-sm font-sans outline-none focus:ring-1 focus:ring-primary appearance-none"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                    >
                      <option value="Manager">Store Manager</option>
                      <option value="Admin">Administrator</option>
                      <option value="User">Standard Staff</option>
                    </select>
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <Button
                      className="w-full bg-primary font-sans text-[10px] uppercase tracking-widest h-12"
                      onClick={() => {
                        if (!inviteEmail || !inviteName) return;

                        // Add to auth store
                        addUser({
                          name: inviteName,
                          email: inviteEmail,
                          role: inviteRole,
                          points: 0,
                          referralCode: `NINA-STAFF-${Math.floor(Math.random() * 1000)}`
                        });

                        // Also add to admin customers list so they show up in the table
                        addCustomer({
                          id: `staff-${Date.now()}`,
                          name: inviteName,
                          email: inviteEmail,
                          totalSpent: '0.00',
                          orderCount: 0,
                          joinDate: new Date().toISOString().split('T')[0]
                        });

                        setIsInviteDialogOpen(false);
                        setInviteEmail('');
                        setInviteName('');
                        toast.success(`Staff account created for ${inviteName}`);
                      }}
                    >
                      Create Account
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full font-sans text-[10px] uppercase tracking-widest h-10 text-muted-foreground"
                      onClick={() => setIsInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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

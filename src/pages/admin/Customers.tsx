import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, Mail, DollarSign, ShoppingBag, Calendar, Shield, Trash2, UserPlus, Download, Users, Clock, Send, Loader2 } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdminStore, type AdminCustomer as Customer } from '@/stores/adminStore';
import { useAuthStore, ADMIN_EMAIL } from '@/stores/authStore';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';
import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';

interface WaitlistEntry {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export default function AdminCustomers() {
  const { customers, deleteCustomer, addCustomer, _hasHydrated } = useAdminStore();
  const { user: cloudUser } = useCloudAuthStore();
  const { users, updateUserRole, deleteAccount, addUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('User');

  // Waitlist state
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState('');
  const [isLoadingWaitlist, setIsLoadingWaitlist] = useState(false);
  const [activeTab, setActiveTab] = useState('customers');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSendingLaunch, setIsSendingLaunch] = useState(false);

  const isOwner = cloudUser?.isAdmin || cloudUser?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const fetchWaitlist = useCallback(async () => {
    setIsLoadingWaitlist(true);
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setWaitlist((data || []) as WaitlistEntry[]);
    } catch (err) {
      console.error('Failed to fetch waitlist:', err);
      toast.error('Failed to load waitlist');
    } finally {
      setIsLoadingWaitlist(false);
    }
  }, []);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

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

  const filteredWaitlist = useMemo(() => {
    if (!waitlistSearch) return waitlist;
    const q = waitlistSearch.toLowerCase();
    return waitlist.filter(w =>
      w.email.toLowerCase().includes(q) ||
      (w.name && w.name.toLowerCase().includes(q))
    );
  }, [waitlist, waitlistSearch]);

  const handleDeleteWaitlistEntry = async (id: string) => {
    if (!confirm('Remove this person from the waitlist?')) return;
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      setWaitlist(prev => prev.filter(w => w.id !== id));
      toast.success('Removed from waitlist');
    } catch (err) {
      console.error('Delete waitlist entry failed:', err);
      toast.error('Failed to remove entry');
    }
  };

  const downloadWaitlistCsv = () => {
    if (waitlist.length === 0) {
      toast.error('No waitlist entries to download');
      return;
    }
    const escapeCsv = (val: string) => val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    const headers = 'Email,Name,Signup Date';
    const rows = waitlist.map(w =>
      [escapeCsv(w.email), escapeCsv(w.name || ''), new Date(w.created_at).toLocaleDateString()].join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nina_armend_waitlist_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded ${waitlist.length} waitlist entries`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredWaitlist.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredWaitlist.map(w => w.id)));
    }
  };

  const handleSendLaunchEmail = async () => {
    const selected = waitlist.filter(w => selectedIds.has(w.id));
    if (selected.length === 0) return;
    if (!confirm(`Send launch announcement email to ${selected.length} recipient${selected.length > 1 ? 's' : ''}?`)) return;

    setIsSendingLaunch(true);
    try {
      const emails = selected.map(w => w.email);
      const names: Record<string, string> = {};
      selected.forEach(w => { if (w.name) names[w.email] = w.name; });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { type: 'launch_announcement', data: { emails, names } },
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Failed to send');

      toast.success(`Launch email sent to ${selected.length} recipient${selected.length > 1 ? 's' : ''}!`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Send launch email failed:', err);
      toast.error('Failed to send launch email');
    } finally {
      setIsSendingLaunch(false);
    }
  };

  // Show loading skeleton while data is being restored from storage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-secondary/20">
        <Header />
        <div className="pt-32 md:pt-40 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
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
                  <p className="font-serif text-2xl">{customers.length + waitlist.length}</p>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="font-sans">
                <TabsTrigger value="customers" className="text-xs uppercase tracking-widest">
                  <Users className="h-3.5 w-3.5 mr-1.5" />
                  Customers
                </TabsTrigger>
                <TabsTrigger value="waitlist" className="text-xs uppercase tracking-widest">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  Waitlist
                  {waitlist.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5">{waitlist.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customers" className="space-y-6 mt-6">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                  <div className="p-6 bg-gradient-to-br from-background to-secondary/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h3 className="font-sans text-[10px] uppercase tracking-widest font-bold">Avg. Lifetime Value</h3>
                    </div>
                    <p className="font-serif text-2xl">
                      ${customers.length > 0
                        ? (customers.reduce((sum, c) => sum + parseFloat(c.totalSpent || '0'), 0) / customers.length).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-background to-secondary/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ShoppingBag className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-sans text-[10px] uppercase tracking-widest font-bold">Repeat Purchase Rate</h3>
                    </div>
                    <p className="font-serif text-2xl">
                      {customers.length > 0
                        ? `${Math.round((customers.filter(c => c.orderCount > 1).length / customers.length) * 100)}%`
                        : '0%'}
                    </p>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-background to-secondary/30 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <DollarSign className="h-4 w-4 text-amber-600" />
                      </div>
                      <h3 className="font-sans text-[10px] uppercase tracking-widest font-bold">Total Revenue</h3>
                    </div>
                    <p className="font-serif text-2xl">
                      ${customers.reduce((sum, c) => sum + parseFloat(c.totalSpent || '0'), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="waitlist" className="space-y-6 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-center gap-4 bg-background border rounded-lg px-3 py-2 flex-1 w-full sm:w-auto">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      placeholder="Search waitlist..."
                      value={waitlistSearch}
                      onChange={(e) => setWaitlistSearch(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm w-full font-sans"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedIds.size > 0 && (
                      <Button
                        size="sm"
                        onClick={handleSendLaunchEmail}
                        disabled={isSendingLaunch}
                        className="bg-primary font-sans text-[10px] uppercase tracking-widest"
                      >
                        {isSendingLaunch ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Send Launch Email ({selectedIds.size})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadWaitlistCsv}
                      className="font-sans text-[10px] uppercase tracking-widest"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download CSV
                    </Button>
                    <div className="bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                      <p className="text-[10px] font-sans uppercase tracking-widest text-primary font-bold">Waitlist</p>
                      <p className="font-serif text-2xl">{waitlist.length}</p>
                    </div>
                  </div>
                </div>

                {isLoadingWaitlist ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={filteredWaitlist.length > 0 && selectedIds.size === filteredWaitlist.length}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead className="font-sans text-[10px] uppercase tracking-widest">Email</TableHead>
                          <TableHead className="font-sans text-[10px] uppercase tracking-widest">Name</TableHead>
                          <TableHead className="font-sans text-[10px] uppercase tracking-widest">Signup Date</TableHead>
                          <TableHead className="font-sans text-[10px] uppercase tracking-widest w-[60px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWaitlist.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center font-sans text-muted-foreground">
                              {waitlist.length === 0 ? 'No one has joined the waitlist yet.' : 'No results matching your search.'}
                            </TableCell>
                          </TableRow>
                        ) : filteredWaitlist.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.has(entry.id)}
                                onCheckedChange={() => toggleSelect(entry.id)}
                              />
                            </TableCell>
                            <TableCell className="font-sans text-sm">{entry.email}</TableCell>
                            <TableCell className="font-sans text-sm text-muted-foreground">{entry.name || '—'}</TableCell>
                            <TableCell className="font-sans text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteWaitlistEntry(entry.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Customer Detail Dialog */}
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

                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-primary/5">
                          <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Total Spent</p>
                          <p className="font-serif text-xl font-bold text-primary">${parseFloat(selectedCustomer.totalSpent).toFixed(2)}</p>
                        </div>
                        <div className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-primary/5">
                          <p className="text-[10px] font-sans tracking-widest uppercase text-muted-foreground mb-1">Orders</p>
                          <p className="font-serif text-xl font-bold">{selectedCustomer.orderCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-muted-foreground border-b pb-2">Customer Info</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-primary/60" />
                            <span className="text-muted-foreground">{selectedCustomer.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-primary/60" />
                            <span className="text-muted-foreground italic text-xs">Joined {selectedCustomer.joinDate}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <ShoppingBag className="h-4 w-4 text-primary/60" />
                            <span className="text-muted-foreground">{selectedCustomer.orderCount} order{selectedCustomer.orderCount !== 1 ? 's' : ''} placed</span>
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

                        addUser({
                          name: inviteName,
                          email: inviteEmail,
                          role: inviteRole,
                          points: 0,
                          referralCode: `NINA-STAFF-${Math.floor(Math.random() * 1000)}`
                        });

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
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

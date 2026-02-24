import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Truck, Package, XCircle, Eye, Edit3, Plus, Loader2, Search, X, Filter } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdminStore, type AdminOrder } from '@/stores/adminStore';
import { useOrdersDb } from '@/hooks/useOrdersDb';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function AdminOrders() {
  const { orders, productOverrides, _hasHydrated } = useAdminStore();
  const { updateOrderDb, createManualOrder } = useOrdersDb();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('all_active');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Available years from order data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    orders.forEach(o => {
      const y = new Date(o.date).getFullYear();
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (filterStatus === 'all_active') {
      result = result.filter(o => o.status !== 'Cancelled');
    } else if (filterStatus !== 'all') {
      result = result.filter(o => o.status === filterStatus);
    }

    // Year filter
    if (filterYear !== 'all') {
      const year = parseInt(filterYear);
      result = result.filter(o => new Date(o.date).getFullYear() === year);
    }

    // Month filter
    if (filterMonth !== 'all') {
      const month = parseInt(filterMonth);
      result = result.filter(o => new Date(o.date).getMonth() === month);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
      );
    }

    return result;
  }, [orders, filterStatus, filterYear, filterMonth, searchQuery]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset page when filters change
  const updateFilter = (setter: (v: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const hasActiveFilters = filterStatus !== 'all_active' || filterYear !== 'all' || filterMonth !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setFilterStatus('all_active');
    setFilterYear('all');
    setFilterMonth('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const [editStatus, setEditStatus] = useState<AdminOrder['status']>('Pending');
  const [editTracking, setEditTracking] = useState('');
  const [editShippingCost, setEditShippingCost] = useState('');
  const [editItemCost, setEditItemCost] = useState('');

  // Manual order creation state
  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerEmail: '',
    shippingCost: '0.00',
    itemCost: '0.00',
  });
  const [newOrderItems, setNewOrderItems] = useState<Array<{
    productId: string;
    title: string;
    size: string;
    quantity: number;
    price: string;
    image: string;
  }>>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const activeProducts = Object.entries(productOverrides)
    .filter(([_, p]) => !p.isDeleted && p.status !== 'Inactive')
    .map(([id, p]) => ({ id, ...p }));

  // Show loading skeleton while data is being restored from storage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-secondary/20">
        <Header />
        <div className="pt-32 md:pt-40 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
          <div className="flex flex-col gap-8 lg:gap-12">
            <AdminSidebar />
            <main className="flex-1 space-y-8 bg-card p-4 sm:p-8 rounded-2xl border border-border/50 shadow-sm">
              <Skeleton className="h-10 w-48" />
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

  const handleEdit = (order: AdminOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.status);
    setEditTracking(order.trackingNumber || '');
    setEditShippingCost(order.shippingCost || '0.00');
    setEditItemCost(order.itemCost || '0.00');
    setIsEditing(true);
  };

  const handleView = (order: AdminOrder) => {
    setSelectedOrder(order);
    setIsViewing(true);
  };

  const saveOrderChanges = async () => {
    if (selectedOrder) {
      const success = await updateOrderDb(selectedOrder.id, {
        status: editStatus,
        trackingNumber: editTracking,
        shippingCost: editShippingCost,
        itemCost: editItemCost
      });

      if (success) {
        toast.success('Order updated successfully');
        setIsEditing(false);
      } else {
        toast.error('Failed to save. Please try again.');
      }
    }
  };

  const addItemToNewOrder = () => {
    if (!selectedProductId) return;
    const product = activeProducts.find(p => p.id === selectedProductId);
    if (!product) return;

    setNewOrderItems(prev => [...prev, {
      productId: product.id,
      title: product.title,
      size: selectedSize,
      quantity: selectedQty,
      price: product.price,
      image: product.image || '',
    }]);
    setSelectedProductId('');
    setSelectedSize('');
    setSelectedQty(1);
  };


  const handleCreateOrder = async () => {
    if (!newOrder.customerName.trim()) {
      toast.error('Please enter a customer name');
      return;
    }
    if (!newOrder.customerEmail.trim()) {
      toast.error('Please enter a customer email');
      return;
    }
    if (newOrderItems.length === 0) {
      toast.error('Please add at least one item to the order');
      return;
    }

    setIsSubmitting(true);

    const orderTotal = newOrderItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0) + parseFloat(newOrder.shippingCost || '0');

    const order: AdminOrder = {
      id: `#MAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      customerName: newOrder.customerName,
      customerEmail: newOrder.customerEmail,
      date: new Date().toISOString().split('T')[0],
      total: orderTotal.toFixed(2),
      shippingCost: newOrder.shippingCost,
      itemCost: newOrder.itemCost,
      status: 'Processing',
      trackingNumber: '',
      items: newOrderItems.map(item => ({
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        size: item.size,
      })),
    };

    const result = await createManualOrder(order);
    setIsSubmitting(false);

    if (result === true) {
      toast.success('Manual order created and inventory updated');
      setIsCreating(false);
      setNewOrder({ customerName: '', customerEmail: '', shippingCost: '0.00', itemCost: '0.00' });
      setNewOrderItems([]);
    } else {
      toast.error(typeof result === 'string' ? result : 'Failed to create order');
    }
  };

  const getStatusIcon = (status: AdminOrder['status']) => {
    switch (status) {
      case 'Delivered': return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'Shipped': return <Truck className="h-3 w-3 mr-1" />;
      case 'Processing': return <Package className="h-3 w-3 mr-1" />;
      case 'Pending': return <Clock className="h-3 w-3 mr-1" />;
      case 'Cancelled': return <XCircle className="h-3 w-3 mr-1" />;
    }
  };

  const getStatusClass = (status: AdminOrder['status']) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-100 text-emerald-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Processing': return 'bg-amber-100 text-amber-800';
      case 'Pending': return 'bg-slate-100 text-slate-800';
      case 'Cancelled': return 'bg-rose-100 text-rose-800';
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-32 md:pt-40 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-8 lg:gap-12">
          <AdminSidebar />

          <main className="flex-1 space-y-8 bg-card p-4 sm:p-8 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-3xl">Manage Orders</h1>
              <Button onClick={() => setIsCreating(true)} className="font-sans text-[10px] uppercase tracking-widest">
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-end gap-3 p-4 bg-secondary/10 rounded-lg border border-border/30">
              <div className="flex items-center gap-1.5 text-muted-foreground mr-1">
                <Filter className="h-4 w-4" />
                <span className="font-sans text-[10px] uppercase tracking-widest font-medium">Filters</span>
              </div>

              <div className="grid gap-1">
                <Label className="font-sans text-[9px] uppercase tracking-widest text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={(v) => updateFilter(setFilterStatus, v)}>
                  <SelectTrigger className="h-8 w-[140px] font-sans text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[300]">
                    <SelectItem value="all_active">All (Active)</SelectItem>
                    <SelectItem value="all">All (Inc. Cancelled)</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <Label className="font-sans text-[9px] uppercase tracking-widest text-muted-foreground">Year</Label>
                <Select value={filterYear} onValueChange={(v) => updateFilter(setFilterYear, v)}>
                  <SelectTrigger className="h-8 w-[100px] font-sans text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[300]">
                    <SelectItem value="all">All Years</SelectItem>
                    {availableYears.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <Label className="font-sans text-[9px] uppercase tracking-widest text-muted-foreground">Month</Label>
                <Select value={filterMonth} onValueChange={(v) => updateFilter(setFilterMonth, v)}>
                  <SelectTrigger className="h-8 w-[130px] font-sans text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[300]">
                    <SelectItem value="all">All Months</SelectItem>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1">
                <Label className="font-sans text-[9px] uppercase tracking-widest text-muted-foreground">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => updateFilter(setSearchQuery as any, e.target.value)}
                    placeholder="ID, name, email..."
                    className="h-8 pl-8 w-[180px] font-sans text-xs"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 font-sans text-[9px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}

              <div className="ml-auto text-xs font-sans text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Order ID</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Customer</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Date</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Total</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Tracking</TableHead>
                    <TableHead className="text-right font-sans text-[10px] uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium font-sans text-sm">{order.id}</TableCell>
                      <TableCell className="font-sans text-sm">{order.customerName}</TableCell>
                      <TableCell className="font-sans text-sm">{order.date}</TableCell>
                      <TableCell className="font-sans text-sm font-medium">${parseFloat(order.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans tracking-widest uppercase font-medium ${getStatusClass(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{order.trackingNumber}</span>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(order)}>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(order)}>
                          <Edit3 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-sans text-sm">
                        No orders found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4 border-t">
                <div className="text-xs text-muted-foreground font-sans uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="font-sans text-[10px] uppercase tracking-widest"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="font-sans text-[10px] uppercase tracking-widest"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* View Order Dialog */}
            <Dialog open={isViewing} onOpenChange={setIsViewing}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Order Details</DialogTitle>
                  <DialogDescription className="font-sans text-sm">
                    Summary for order {selectedOrder?.id}
                  </DialogDescription>
                </DialogHeader>

                {selectedOrder && (
                  <div className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-8 border-b pb-6">
                      <div>
                        <h4 className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Customer</h4>
                        <p className="font-sans text-sm font-medium">{selectedOrder.customerName}</p>
                        <p className="font-sans text-xs text-muted-foreground">{selectedOrder.customerEmail}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Status</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans tracking-widest uppercase font-medium ${getStatusClass(selectedOrder.status)}`}>
                          {getStatusIcon(selectedOrder.status)}
                          {selectedOrder.status}
                        </span>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {selectedOrder.shippingAddress && (
                      <div className="border-b pb-6">
                        <h4 className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Shipping Address</h4>
                        <div className="font-sans text-sm space-y-0.5">
                          {selectedOrder.shippingAddress.addressLine1 && <p>{selectedOrder.shippingAddress.addressLine1}</p>}
                          {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                          <p>
                            {[selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.state, selectedOrder.shippingAddress.postalCode]
                              .filter(Boolean).join(', ')}
                          </p>
                          {selectedOrder.shippingAddress.country && <p>{selectedOrder.shippingAddress.country}</p>}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b pb-6">
                      <div>
                        <h4 className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Revenue</h4>
                        <p className="font-sans text-sm font-medium">${parseFloat(selectedOrder.total).toFixed(2)}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Shipping Cost</h4>
                        <p className="font-sans text-sm font-medium text-destructive">-${parseFloat(selectedOrder.shippingCost || '0').toFixed(2)}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Item Cost (COGS)</h4>
                        <p className="font-sans text-sm font-medium text-destructive">
                          -${(() => {
                            const manualCost = parseFloat(selectedOrder.itemCost || '0');
                            if (manualCost > 0) return manualCost.toFixed(2);
                            const autoCost = selectedOrder.items.reduce((sum, item) => {
                              const match = Object.values(productOverrides).find(p => p.title === item.title);
                              return sum + (parseFloat(match?.unitCost || '0') * item.quantity);
                            }, 0);
                            return autoCost.toFixed(2);
                          })()}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground mb-2">Profit</h4>
                        <p className="font-sans text-sm font-medium text-emerald-600">
                          ${(() => {
                            const revenue = parseFloat(selectedOrder.total);
                            const shipping = parseFloat(selectedOrder.shippingCost || '0');
                            const manualCost = parseFloat(selectedOrder.itemCost || '0');
                            const cost = manualCost > 0 ? manualCost : selectedOrder.items.reduce((sum, item) => {
                              const match = Object.values(productOverrides).find(p => p.title === item.title);
                              return sum + (parseFloat(match?.unitCost || '0') * item.quantity);
                            }, 0);
                            return (revenue - shipping - cost).toFixed(2);
                          })()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground">Order Items</h4>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-secondary/20 p-3 rounded-lg">
                            <img src={item.image} alt="" className="w-12 h-16 object-cover rounded shadow-sm border" />
                            <div className="flex-1">
                              <p className="font-sans text-sm font-medium">{item.title}</p>
                              <p className="font-sans text-xs text-muted-foreground">
                                {item.size ? `Size: ${item.size} · ` : ''}Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="font-sans text-sm font-medium">${parseFloat(item.price).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <span className="font-serif text-xl">Total</span>
                      <span className="font-serif text-2xl text-primary">${parseFloat(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button onClick={() => setIsViewing(false)} className="font-sans text-[10px] uppercase tracking-widest">Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Order Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Update Order</DialogTitle>
                  <DialogDescription className="font-sans text-sm">
                    Change status or tracking for {selectedOrder?.id}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status" className="font-sans text-[10px] uppercase tracking-widest">Order Status</Label>
                    <Select value={editStatus} onValueChange={(val: AdminOrder['status']) => setEditStatus(val)}>
                      <SelectTrigger id="status" className="font-sans text-sm">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[300]">
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Shipped">Shipped</SelectItem>
                        <SelectItem value="Delivered">Delivered</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tracking" className="font-sans text-[10px] uppercase tracking-widest">Tracking Number</Label>
                    <Input
                      id="tracking"
                      value={editTracking}
                      onChange={(e) => setEditTracking(e.target.value)}
                      placeholder="e.g. NA-123456"
                      className="font-sans text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="shippingCost" className="font-sans text-[10px] uppercase tracking-widest">Shipping Cost</Label>
                      <Input
                        id="shippingCost"
                        type="number"
                        step="0.01"
                        value={editShippingCost}
                        onChange={(e) => setEditShippingCost(e.target.value)}
                        className="font-sans text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="itemCost" className="font-sans text-[10px] uppercase tracking-widest">Item Cost (COGS)</Label>
                      <Input
                        id="itemCost"
                        type="number"
                        step="0.01"
                        value={editItemCost}
                        onChange={(e) => setEditItemCost(e.target.value)}
                        className="font-sans text-sm"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="font-sans text-[10px] uppercase tracking-widest">Cancel</Button>
                  <Button onClick={saveOrderChanges} className="bg-primary font-sans text-[10px] uppercase tracking-widest">Save Updates</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Create Manual Order Dialog */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Create Manual Order</DialogTitle>
                  <DialogDescription className="font-sans text-sm">
                    Add a POS, phone, or custom order. Inventory will be decremented automatically.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="font-sans text-[10px] uppercase tracking-widest">Customer Name</Label>
                      <Input
                        value={newOrder.customerName}
                        onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                        placeholder="Jane Doe"
                        className="font-sans text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-sans text-[10px] uppercase tracking-widest">Customer Email</Label>
                      <Input
                        value={newOrder.customerEmail}
                        onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
                        placeholder="jane@example.com"
                        className="font-sans text-sm"
                      />
                    </div>
                  </div>

                  {/* Add items */}
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground">Add Items</h4>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <Select value={selectedProductId} onValueChange={(val) => {
                          setSelectedProductId(val);
                          setSelectedSize('');
                        }}>
                          <SelectTrigger className="font-sans text-sm">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-[200px] overflow-y-auto z-[300]">
                            {activeProducts.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Select value={selectedSize} onValueChange={setSelectedSize}>
                          <SelectTrigger className="font-sans text-sm">
                            <SelectValue placeholder="Size" />
                          </SelectTrigger>
                          <SelectContent position="popper" className="max-h-[200px] overflow-y-auto z-[300]">
                            {(activeProducts.find(p => p.id === selectedProductId)?.sizes?.length
                              ? activeProducts.find(p => p.id === selectedProductId)!.sizes
                              : Object.keys(activeProducts.find(p => p.id === selectedProductId)?.sizeInventory || {})
                            ).map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={1}
                          value={selectedQty}
                          onChange={(e) => setSelectedQty(parseInt(e.target.value) || 1)}
                          className="font-sans text-sm"
                          placeholder="Qty"
                        />
                      </div>
                      <div className="col-span-2">
                        <Button onClick={addItemToNewOrder} variant="outline" className="w-full font-sans text-[10px] uppercase tracking-widest" disabled={!selectedProductId}>
                          Add
                        </Button>
                      </div>
                    </div>

                    {/* Item list */}
                    {newOrderItems.length > 0 && (
                      <div className="space-y-2">
                        {newOrderItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-secondary/20 p-2 rounded-lg">
                            <div className="flex-1">
                              <p className="font-sans text-sm">{item.title} {item.size ? `(${item.size})` : ''}</p>
                              <p className="font-sans text-xs text-muted-foreground">Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setNewOrderItems(prev => prev.filter((_, i) => i !== idx))}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <p className="text-right font-sans text-sm font-medium">
                          Items subtotal: ${newOrderItems.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div className="grid gap-2">
                      <Label className="font-sans text-[10px] uppercase tracking-widest">Shipping Cost</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newOrder.shippingCost}
                        onChange={(e) => setNewOrder({ ...newOrder, shippingCost: e.target.value })}
                        className="font-sans text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="font-sans text-[10px] uppercase tracking-widest">Item Cost (COGS)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newOrder.itemCost}
                        onChange={(e) => setNewOrder({ ...newOrder, itemCost: e.target.value })}
                        className="font-sans text-sm"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isSubmitting} className="font-sans text-[10px] uppercase tracking-widest">Cancel</Button>
                  <Button onClick={handleCreateOrder} disabled={isSubmitting} className="bg-primary font-sans text-[10px] uppercase tracking-widest">
                    {isSubmitting ? <><Loader2 className="h-3 w-3 animate-spin mr-2" /> Creating...</> : 'Create Order'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Truck, Package, XCircle, Eye, Edit3 } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdminStore, type AdminOrder } from '@/stores/adminStore';
import { useOrdersDb } from '@/hooks/useOrdersDb';
import { useState } from 'react';
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

export default function AdminOrders() {
  const { orders, _hasHydrated } = useAdminStore();
  const { updateOrderDb } = useOrdersDb();
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const [editStatus, setEditStatus] = useState<AdminOrder['status']>('Pending');
  const [editTracking, setEditTracking] = useState('');
  const [editShippingCost, setEditShippingCost] = useState('');
  const [editItemCost, setEditItemCost] = useState('');

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
    setEditTracking(order.trackingNumber);
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
        toast.success(`Order ${selectedOrder.id} updated successfully`);
        setIsEditing(false);
      }
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
            <h1 className="font-serif text-3xl">Manage Orders</h1>

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
                  {orders.map((order) => (
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
                </TableBody>
              </Table>
            </div>

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

                    <div className="grid grid-cols-3 gap-4 border-b pb-6">
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
                        <p className="font-sans text-sm font-medium text-destructive">-${parseFloat(selectedOrder.itemCost || '0').toFixed(2)}</p>
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
                              <p className="font-sans text-xs text-muted-foreground">Qty: {item.quantity}</p>
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
                      <SelectContent>
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
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

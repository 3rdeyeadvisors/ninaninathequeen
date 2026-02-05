
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Package, Truck, AlertCircle } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useAdminStore } from '@/stores/adminStore';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminOrders() {
  const { orders, updateOrderStatus } = useAdminStore();

  const handleStatusUpdate = (id: string, currentStatus: string) => {
    let nextStatus: any = 'Processing';
    if (currentStatus === 'Pending') nextStatus = 'Processing';
    else if (currentStatus === 'Processing') nextStatus = 'Shipped';
    else if (currentStatus === 'Shipped') nextStatus = 'Delivered';
    else return;

    updateOrderStatus(id, nextStatus);
    toast.success(`Order ${id} updated to ${nextStatus}`);
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-4">
          <AdminSidebar />

          {/* Main Content */}
          <main className="w-full space-y-8 bg-card p-8 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-2">
              <h1 className="font-serif text-4xl tracking-tight">Order Management</h1>
              <p className="text-muted-foreground text-sm">Monitor and fulfill your customer transactions from online and POS</p>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">
                          {order.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell className="font-sans font-bold">{order.total}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-medium ${
                          order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'Processing' ? 'bg-amber-100 text-amber-800' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {order.status === 'Delivered' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {order.status === 'Processing' && <Clock className="h-3 w-3 mr-1" />}
                          {order.status === 'Shipped' && <Truck className="h-3 w-3 mr-1" />}
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-mono text-muted-foreground">{order.tracking}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[10px] uppercase tracking-widest h-8"
                              onClick={() => handleStatusUpdate(order.id, order.status)}
                            >
                              Move to {order.status === 'Pending' ? 'Processing' : order.status === 'Processing' ? 'Ship' : 'Deliver'}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="text-primary text-[10px] uppercase tracking-widest h-8">Details</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

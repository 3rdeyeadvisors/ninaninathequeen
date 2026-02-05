
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2 } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const orders = [
  { id: '#ORD-7829', customer: 'Alice Johnson', date: '2025-05-15', total: '$160.00', status: 'Delivered', tracking: 'NA-982341' },
  { id: '#ORD-7830', customer: 'Bob Smith', date: '2025-05-16', total: '$85.00', status: 'Processing', tracking: 'Pending' },
  { id: '#ORD-7831', customer: 'Charlie Davis', date: '2025-05-17', total: '$245.00', status: 'Shipped', tracking: 'NA-982345' },
  { id: '#ORD-7832', customer: 'Diana Prince', date: '2025-05-18', total: '$120.00', status: 'Pending', tracking: 'Pending' },
];

export default function AdminOrders() {
  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-32 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">
          <AdminSidebar />

          {/* Main Content */}
          <main className="flex-1 space-y-8 bg-card p-8 rounded-2xl border border-border/50 shadow-sm">
            <h1 className="font-serif text-3xl">Recent Orders</h1>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
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
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.total}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status === 'Delivered' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {order.status === 'Processing' && <Clock className="h-3 w-3 mr-1" />}
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-muted-foreground">{order.tracking}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="link" size="sm" className="text-primary">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}


import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search, Edit2, Trash2, Upload, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_PRODUCTS } from '@/lib/mockData';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminProducts() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast.error("Product deleted");
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-24 pb-12 container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-2">
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-card rounded-lg transition-colors">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="font-sans">Dashboard</span>
            </Link>
            <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-lg shadow-sm">
              <Plus className="h-5 w-5" />
              <span className="font-sans font-medium">Products</span>
            </Link>
            <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 hover:bg-card rounded-lg transition-colors">
              <Box className="h-5 w-5 text-muted-foreground" />
              <span className="font-sans">Orders</span>
            </Link>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8 bg-card p-8 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="font-serif text-3xl">Products</h1>
              <Button className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            </div>

            <div className="flex items-center gap-4 bg-background border rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search products..."
                className="bg-transparent border-none outline-none text-sm w-full"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Inventory</TableHead>
                  <TableHead>360° View</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <img src={product.images[0]} alt="" className="w-12 h-16 object-cover rounded" />
                    </TableCell>
                    <TableCell className="font-medium">{product.title}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>${product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans tracking-widest uppercase font-medium bg-emerald-100 text-emerald-800 w-fit">
                          In Stock
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {product.id === 'm1' ? '12' : product.id === 'm2' ? '8' : '24'} units
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Sequence
                      </Button>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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


import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Search, Edit2, Trash2, Upload, Box, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
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
import { Textarea } from "@/components/ui/textarea";

interface EditableProduct {
  id: string;
  title: string;
  price: string;
  inventory: number;
  image: string;
  description: string;
}

export default function AdminProducts() {
  const { data: products, isLoading } = useProducts(50);
  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleDelete = (id: string) => {
    toast.error("Delete functionality is restricted in demo mode");
  };

  const handleAiDescription = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setEditingProduct({
        ...editingProduct,
        description: `Experience ultimate Brazilian luxury with the ${editingProduct.title}. Handcrafted from our signature double-lined Italian fabric, this piece features a sophisticated silhouette designed to accentuate your natural curves while providing premium comfort and support.`
      });
      setIsAiGenerating(false);
      toast.success("Magic AI description generated!");
    }, 1500);
  };

  const handleSave = () => {
    toast.success("Product updated successfully (Simulated)");
    setEditingProduct(null);
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

            <div className="overflow-x-auto rounded-lg border">
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : products?.map((product) => (
                  <TableRow key={product.node.id}>
                    <TableCell>
                      <img src={product.node.images.edges[0]?.node.url} alt="" className="w-12 h-16 object-cover rounded" />
                    </TableCell>
                    <TableCell className="font-medium">{product.node.title}</TableCell>
                    <TableCell>Swimwear</TableCell>
                    <TableCell>
                      {product.node.priceRange.minVariantPrice.currencyCode} {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans tracking-widest uppercase font-medium bg-emerald-100 text-emerald-800 w-fit">
                          In Stock
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {product.node.variants.edges[0]?.node.availableForSale ? 'Available' : 'Out of Stock'}
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProduct({
                        id: product.node.id,
                        title: product.node.title,
                        price: product.node.priceRange.minVariantPrice.amount,
                        inventory: 45,
                        image: product.node.images.edges[0]?.node.url,
                        description: ""
                      })}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product.node.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {/* Edit Product Dialog */}
            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Edit Product</DialogTitle>
                  <DialogDescription>
                    Make changes to your product here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right font-sans text-xs uppercase tracking-wider">Name</Label>
                    <Input
                      id="name"
                      value={editingProduct?.title || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="image" className="text-right font-sans text-xs uppercase tracking-wider">Image URL</Label>
                    <Input
                      id="image"
                      value={editingProduct?.image || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, image: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="inventory" className="text-right font-sans text-xs uppercase tracking-wider">Inventory</Label>
                    <Input
                      id="inventory"
                      type="number"
                      value={editingProduct?.inventory || 0}
                      onChange={(e) => setEditingProduct({...editingProduct, inventory: parseInt(e.target.value)})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4 pt-4 border-t">
                    <div className="flex flex-col items-end gap-2">
                      <Label htmlFor="desc" className="text-right font-sans text-xs uppercase tracking-wider pt-2">Description</Label>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary border-primary/20 hover:bg-primary/5"
                        onClick={handleAiDescription}
                        disabled={isAiGenerating}
                      >
                        {isAiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Textarea
                      id="desc"
                      placeholder="Product description..."
                      value={editingProduct?.description || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="col-span-3 h-32 text-sm leading-relaxed"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
                  <Button onClick={handleSave} className="bg-primary">Save Changes</Button>
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

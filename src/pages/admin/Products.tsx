import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Trash2, Upload, Loader2, Sparkles } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useProducts, type ShopifyProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { useState, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminStore, type ProductOverride } from '@/stores/adminStore';
import { PRODUCT_SIZES } from '@/lib/constants';

export default function AdminProducts() {
  const { data: initialProducts, isLoading } = useProducts(100);
  const { productOverrides, updateProductOverride, deleteProduct } = useAdminStore();
  const [editingProduct, setEditingProduct] = useState<Partial<ProductOverride> | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const products = useMemo(() => {
    if (!initialProducts) return [];

    if (!searchQuery) return initialProducts;

    const q = searchQuery.toLowerCase();
    return initialProducts.filter(p =>
      p.node.title.toLowerCase().includes(q) ||
      (p.node.description || '').toLowerCase().includes(q)
    );
  }, [initialProducts, searchQuery]);

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      toast.success("Product deleted successfully");
      setProductToDelete(null);
    }
  };

  const handleAiDescription = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setEditingProduct({
        ...editingProduct,
        description: `Experience ultimate Brazilian luxury with the ${editingProduct?.title || 'product'}. Handcrafted from our signature double-lined Italian fabric, this piece features a sophisticated silhouette designed to accentuate your natural curves while providing premium comfort and support.`
      });
      setIsAiGenerating(false);
      toast.success("Magic AI description generated!");
    }, 1500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct(prev => prev ? { ...prev, image: reader.result as string } : null);
        toast.success("Image uploaded successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!editingProduct || !editingProduct.id) return;
    updateProductOverride(editingProduct.id, editingProduct);
    toast.success(isAddingProduct ? "Product added successfully!" : "Product updated successfully!");
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  const startAdding = () => {
    setIsAddingProduct(true);
    const initialSizeInventory: Record<string, number> = {};
    PRODUCT_SIZES.forEach(s => initialSizeInventory[s] = 0);

    setEditingProduct({
      id: `new-${Date.now()}`,
      title: "",
      price: "0.00",
      inventory: 0,
      sizeInventory: initialSizeInventory,
      image: "https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=800",
      description: "",
      sizes: [...PRODUCT_SIZES]
    });
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-8 lg:gap-12">
          <AdminSidebar />

          <main className="flex-1 space-y-8 bg-card p-4 sm:p-8 rounded-2xl border border-border/50 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="font-serif text-3xl">Products</h1>
              <Button className="bg-primary" onClick={startAdding}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            </div>

            <div className="flex items-center gap-4 bg-background border rounded-lg px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full font-sans"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Image</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Product Name</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Sizes</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Price</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">360° View</TableHead>
                    <TableHead className="text-right font-sans text-[10px] uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : products.map((product) => (
                    <TableRow key={product.node.id}>
                      <TableCell>
                        <img src={product.node.images.edges[0]?.node.url} alt="" className="w-12 h-16 object-cover rounded shadow-sm border" />
                      </TableCell>
                      <TableCell className="font-medium font-sans text-sm">{product.node.title}</TableCell>
                      <TableCell className="font-sans text-[10px] text-muted-foreground">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(product.node.options.find(o => o.name === 'Size')?.values || []).map(s => {
                            const sizeStock = productOverrides[product.node.id]?.sizeInventory?.[s] ?? 0;
                            return (
                              <span key={s} className={`px-1 rounded ${sizeStock > 0 ? 'bg-secondary' : 'bg-destructive/10 text-destructive'}`}>
                                {s} ({sizeStock})
                              </span>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="font-sans text-sm font-medium">
                        {product.node.priceRange.minVariantPrice.currencyCode} {parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans tracking-widest uppercase font-medium bg-emerald-100 text-emerald-800 w-fit">
                            In Stock
                          </span>
                          <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-tighter">
                            {product.node.variants.edges[0]?.node.availableForSale ? 'Available Online' : 'Out of Stock'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-sans text-[10px] uppercase tracking-widest">
                          <Upload className="h-3 w-3 mr-2" />
                          Sequence
                        </Button>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          const sizes = product.node.options.find(o => o.name === 'Size')?.values || [];
                          const override = productOverrides[product.node.id];
                          let sizeInventory = override?.sizeInventory;

                          // Initialize sizeInventory if missing
                          if (!sizeInventory) {
                            const totalInventory = override?.inventory || 45;
                            const perSize = Math.floor(totalInventory / (sizes.length || 1));
                            sizeInventory = {};
                            sizes.forEach((s, idx) => {
                              sizeInventory![s] = idx === sizes.length - 1 ? totalInventory - (perSize * (sizes.length - 1)) : perSize;
                            });
                          }

                          setEditingProduct({
                            id: product.node.id,
                            title: product.node.title,
                            price: product.node.priceRange.minVariantPrice.amount,
                            inventory: override?.inventory || 45,
                            sizeInventory: sizeInventory,
                            image: product.node.images.edges[0]?.node.url,
                            description: product.node.description || "",
                            sizes: sizes
                          });
                        }}>
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/5" onClick={() => setProductToDelete(product.node.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Dialog open={!!editingProduct} onOpenChange={(open) => {
              if (!open) {
                setEditingProduct(null);
                setIsAddingProduct(false);
              }
            }}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">{isAddingProduct ? 'Add New Product' : 'Edit Product'}</DialogTitle>
                  <DialogDescription className="font-sans text-sm text-muted-foreground">
                    {isAddingProduct ? 'Enter the details for the new product.' : 'Make changes to your product here. Click save when you\'re done.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right font-sans text-[10px] uppercase tracking-widest">Name</Label>
                    <Input
                      id="name"
                      value={editingProduct?.title || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                      className="col-span-3 font-sans text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right font-sans text-[10px] uppercase tracking-widest pt-2">Sizes</Label>
                    <div className="col-span-3 flex flex-wrap gap-2">
                      {PRODUCT_SIZES.map(size => (
                        <button
                          key={size}
                          onClick={() => {
                            const currentSizes = editingProduct?.sizes || [];
                            const isSelected = currentSizes.includes(size);
                            const newSizes = isSelected
                              ? currentSizes.filter(s => s !== size)
                              : [...currentSizes, size];

                            const newSizeInventory = { ...(editingProduct?.sizeInventory || {}) };
                            if (isSelected) {
                              delete newSizeInventory[size];
                            } else {
                              newSizeInventory[size] = 0;
                            }

                            const newTotal = Object.values(newSizeInventory).reduce((acc, v) => acc + (v as number), 0);

                            setEditingProduct({
                              ...editingProduct,
                              sizes: newSizes,
                              sizeInventory: newSizeInventory,
                              inventory: newTotal
                            });
                          }}
                          className={`px-2 py-1 text-[10px] font-sans border rounded transition-colors ${
                            editingProduct?.sizes?.includes(size)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-sans text-[10px] uppercase tracking-widest">Image</Label>
                    <div className="col-span-3 flex items-center gap-4">
                      {editingProduct?.image && (
                        <img src={editingProduct.image} alt="Preview" className="w-16 h-20 object-cover rounded-lg border shadow-sm" />
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          ref={imageInputRef}
                        />
                        <Button
                          variant="outline"
                          className="w-full font-sans text-[10px] uppercase tracking-widest h-10"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <Upload className="h-3 w-3 mr-2" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right font-sans text-[10px] uppercase tracking-widest">Price</Label>
                    <Input
                      id="price"
                      type="text"
                      value={editingProduct?.price || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                      className="col-span-3 font-sans text-sm"
                    />
                  </div>
                  {editingProduct?.sizes && editingProduct.sizes.length > 0 && (
                    <div className="grid grid-cols-4 items-start gap-4 py-4 border-y border-border/50">
                      <Label className="text-right font-sans text-[10px] uppercase tracking-widest pt-2">Size Inventory</Label>
                      <div className="col-span-3 grid grid-cols-2 gap-x-4 gap-y-2">
                        {editingProduct.sizes.map(size => (
                          <div key={size} className="flex items-center justify-between gap-2 bg-secondary/20 p-1.5 rounded-lg border border-border/50">
                            <span className="text-[10px] font-bold w-8">{size}</span>
                            <Input
                              type="number"
                              value={editingProduct.sizeInventory?.[size] ?? 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                const newSizeInventory = {
                                  ...(editingProduct.sizeInventory || {}),
                                  [size]: val
                                };
                                const newTotal = Object.values(newSizeInventory).reduce((acc, v) => acc + v, 0);
                                setEditingProduct({
                                  ...editingProduct,
                                  sizeInventory: newSizeInventory,
                                  inventory: newTotal
                                });
                              }}
                              className="h-7 text-[10px] w-16 px-1"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="inventory" className="text-right font-sans text-[10px] uppercase tracking-widest">Total Stock</Label>
                    <Input
                      id="inventory"
                      type="number"
                      value={editingProduct?.inventory || 0}
                      readOnly
                      className="col-span-3 font-sans text-sm bg-secondary/50"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4 pt-4 border-t">
                    <div className="flex flex-col items-end gap-2">
                      <Label htmlFor="desc" className="text-right font-sans text-[10px] uppercase tracking-widest pt-2">Description</Label>
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
                      className="col-span-3 h-32 text-sm leading-relaxed font-sans"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setEditingProduct(null); setIsAddingProduct(false); }} className="font-sans text-[10px] uppercase tracking-widest">Cancel</Button>
                  <Button onClick={handleSave} className="bg-primary font-sans text-[10px] uppercase tracking-widest">Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif">Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="font-sans">
                    This action cannot be undone. This will permanently delete the product from your store inventory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-sans text-[10px] uppercase tracking-widest">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 font-sans text-[10px] uppercase tracking-widest text-white">
                    Delete Product
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

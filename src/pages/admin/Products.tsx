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
  const imageInputRef = useRef<HTMLInputElement>(null);

  const products = useMemo(() => {
    if (!initialProducts) return [];

    const overridenProducts = initialProducts.map(p => {
      const override = productOverrides[p.node.id];
      if (override) {
        const sizes = override.sizes || (p.node.options.find(o => o.name === 'Size')?.values) || PRODUCT_SIZES;
        return {
          ...p,
          node: {
            ...p.node,
            title: override.title,
            description: override.description,
            priceRange: {
              ...p.node.priceRange,
              minVariantPrice: {
                ...p.node.priceRange.minVariantPrice,
                amount: override.price
              }
            },
            images: {
              ...p.node.images,
              edges: [
                {
                  node: {
                    ...p.node.images.edges[0]?.node,
                    url: override.image
                  }
                },
                ...p.node.images.edges.slice(1)
              ]
            },
            variants: {
              edges: sizes.map(size => ({
                node: {
                  id: `gid://shopify/ProductVariant/${p.node.id}-${size.toLowerCase()}`,
                  title: size,
                  price: { amount: override.price, currencyCode: "USD" },
                  availableForSale: true,
                  selectedOptions: [{ name: "Size", value: size }],
                }
              }))
            },
            options: [{ name: "Size", values: sizes }]
          }
        };
      }
      return p;
    }).filter(p => !productOverrides[p.node.id]?.isDeleted);

    const existingIds = new Set(initialProducts.map(p => p.node.id));
    const newProducts = Object.values(productOverrides)
      .filter(o => !existingIds.has(o.id) && !o.isDeleted)
      .map(o => {
        const sizes = o.sizes || PRODUCT_SIZES;
        return {
          node: {
            id: o.id,
            title: o.title,
            description: o.description,
            handle: o.title.toLowerCase().replace(/ /g, '-'),
            priceRange: {
              minVariantPrice: { amount: o.price, currencyCode: 'USD' }
            },
            images: {
              edges: [{ node: { url: o.image, altText: o.title } }]
            },
            variants: {
              edges: sizes.map(size => ({
                node: {
                  id: `gid://shopify/ProductVariant/${o.id}-${size.toLowerCase()}`,
                  title: size,
                  price: { amount: o.price, currencyCode: "USD" },
                  availableForSale: true,
                  selectedOptions: [{ name: "Size", value: size }],
                }
              }))
            },
            options: [{ name: "Size", values: sizes }]
          }
        };
      }) as ShopifyProduct[];

    const allProducts = [...overridenProducts, ...newProducts];

    if (!searchQuery) return allProducts;

    const q = searchQuery.toLowerCase();
    return allProducts.filter(p =>
      p.node.title.toLowerCase().includes(q) ||
      p.node.description?.toLowerCase().includes(q)
    );
  }, [initialProducts, productOverrides, searchQuery]);

  const handleDelete = (id: string) => {
    deleteProduct(id);
    toast.success("Product deleted successfully");
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
    setEditingProduct({
      id: `new-${Date.now()}`,
      title: "",
      price: "0.00",
      inventory: 0,
      image: "https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=800",
      description: ""
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
                          {(product.node.options.find(o => o.name === 'Size')?.values || []).map(s => (
                            <span key={s} className="px-1 bg-secondary rounded">{s}</span>
                          ))}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingProduct({
                          id: product.node.id,
                          title: product.node.title,
                          price: product.node.priceRange.minVariantPrice.amount,
                          inventory: productOverrides[product.node.id]?.inventory || 45,
                          image: product.node.images.edges[0]?.node.url,
                          description: product.node.description || "",
                          sizes: product.node.options.find(o => o.name === 'Size')?.values || []
                        })}>
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/5" onClick={() => handleDelete(product.node.id)}>
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
                            const newSizes = currentSizes.includes(size)
                              ? currentSizes.filter(s => s !== size)
                              : [...currentSizes, size];
                            setEditingProduct({ ...editingProduct, sizes: newSizes });
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="inventory" className="text-right font-sans text-[10px] uppercase tracking-widest">Stock</Label>
                    <Input
                      id="inventory"
                      type="number"
                      value={editingProduct?.inventory || 0}
                      onChange={(e) => setEditingProduct({...editingProduct, inventory: parseInt(e.target.value)})}
                      className="col-span-3 font-sans text-sm"
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
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

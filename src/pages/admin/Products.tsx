import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Trash2, Upload, Loader2, Sparkles, Download, MoveRight } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useSpreadsheetSync } from '@/hooks/useSpreadsheetSync';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdminStore, type ProductOverride } from '@/stores/adminStore';
import { PRODUCT_SIZES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORIES = ['All', 'Top', 'Bottom', 'Top & Bottom', 'One-Piece', 'Other'] as const;

export default function AdminProducts() {
  const { data: initialProducts, isLoading } = useProducts(1000);
  const { productOverrides, updateProductOverride, deleteProduct, _hasHydrated } = useAdminStore();
  const { isUploading, handleFileUpload, downloadTemplate, fileInputRef: syncInputRef } = useSpreadsheetSync();
  const [editingProduct, setEditingProduct] = useState<Partial<ProductOverride> | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [newColorInput, setNewColorInput] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Count products by category
  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = { All: 0, 'Top & Bottom': 0, 'One-Piece': 0, Other: 0 };
    if (!initialProducts) return counts;
    
    initialProducts.forEach(p => {
      const override = productOverrides[p.id];
      if (override?.isDeleted) return;
      
      counts.All++;
      // Use override category if set, otherwise derive from productType
      const category = override?.category || p.category ||
        (p.productType?.toLowerCase().includes('one-piece') ? 'One-Piece' : 
         p.productType?.toLowerCase().includes('top & bottom') ? 'Top & Bottom' : 'Other');
      if (counts[category] !== undefined) {
        counts[category]++;
      } else {
        counts.Other++;
      }
    });
    
    return counts;
  }, [initialProducts, productOverrides]);

  const products = useMemo(() => {
    if (!initialProducts) return [];

    let filtered = initialProducts;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => {
        const override = productOverrides[p.id];
        const category = override?.category || p.category ||
          (p.productType?.toLowerCase().includes('one-piece') ? 'One-Piece' : 
           p.productType?.toLowerCase().includes('top & bottom') ? 'Top & Bottom' : 'Other');
        return category === selectedCategory;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [initialProducts, searchQuery, selectedCategory, productOverrides]);

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
                <Skeleton className="h-10 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            </main>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
      toast.success("Product deleted successfully");
      setProductToDelete(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === products.length && products.length > 0) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(products.map(p => p.id)));
    }
  };

  const toggleProductSelection = (id: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProducts(newSet);
  };

  const bulkDelete = () => {
    selectedProducts.forEach(id => deleteProduct(id));
    toast.success(`${selectedProducts.size} products deleted`);
    setSelectedProducts(new Set());
    setShowBulkDeleteConfirm(false);
  };

  const moveProductToCategory = (productId: string, category: string) => {
    // Ensure the product exists in overrides before updating category
    const product = products.find(p => p.id === productId);
    if (product) {
      const existingOverride = productOverrides[productId];
      if (!existingOverride) {
        // Create a full override from the current product data
        updateProductOverride(productId, {
          title: product.title,
          price: product.price.amount,
          image: product.images[0]?.url || '',
          description: product.description || '',
          productType: product.productType,
          inventory: 0,
          category,
        });
      } else {
        updateProductOverride(productId, { category });
      }
    }
    toast.success(`Product moved to ${category}`);
  };

  const bulkMoveToCategory = (category: string) => {
    selectedProducts.forEach(id => {
      const product = products.find(p => p.id === id);
      if (product) {
        const existingOverride = productOverrides[id];
        if (!existingOverride) {
          updateProductOverride(id, {
            title: product.title,
            price: product.price.amount,
            image: product.images[0]?.url || '',
            description: product.description || '',
            productType: product.productType,
            inventory: 0,
            category,
          });
        } else {
          updateProductOverride(id, { category });
        }
      }
    });
    toast.success(`${selectedProducts.size} products moved to ${category}`);
    setSelectedProducts(new Set());
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
    if (!editingProduct?.id) return;
    
    // Validation
    if (!editingProduct.title?.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!editingProduct.price || parseFloat(editingProduct.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }
    
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
              <div className="flex flex-wrap gap-2">
                <input
                  type="file"
                  ref={syncInputRef}
                  className="hidden"
                  multiple
                  accept=".csv, .xlsx, .xls, image/*"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  onClick={() => syncInputRef.current?.click()}
                  disabled={isUploading}
                  className="font-sans text-[10px] uppercase tracking-widest"
                >
                  {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
                  Sync Spreadsheet
                </Button>
                <Button
                  variant="ghost"
                  onClick={downloadTemplate}
                  className="font-sans text-[10px] uppercase tracking-widest text-primary"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Template
                </Button>
                <Button className="bg-primary" onClick={startAdding}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                </Button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedProducts(new Set()); // Clear selection when changing category
                  }}
                  className="font-sans text-[10px] uppercase tracking-widest"
                >
                  {cat} ({countByCategory[cat]})
                </Button>
              ))}
            </div>

            {/* Bulk Actions Bar */}
            {selectedProducts.size > 0 && (
              <div className="flex flex-wrap items-center gap-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <span className="font-sans text-sm font-medium">
                  {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-sans text-[10px] uppercase tracking-widest"
                    >
                      <MoveRight className="h-3 w-3 mr-2" />
                      Move to Category
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover z-50">
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <DropdownMenuItem 
                        key={cat} 
                        onClick={() => bulkMoveToCategory(cat)}
                        className="font-sans text-sm cursor-pointer"
                      >
                        {cat}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="font-sans text-[10px] uppercase tracking-widest"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts(new Set())}
                  className="font-sans text-[10px] uppercase tracking-widest"
                >
                  Clear
                </Button>
              </div>
            )}

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
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedProducts.size === products.length && products.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Image</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Item #</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Product Name</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Category</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Colors</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Sizes & Stock</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Price</TableHead>
                    <TableHead className="font-sans text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="text-right font-sans text-[10px] uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : products.map((product) => {
                    const override = productOverrides[product.id];
                    const sizes = product.options.find(o => o.name === 'Size')?.values || override?.sizes || [];
                    const sizeInventory = override?.sizeInventory || {};
                    const hasInventoryData = override?.inventory !== undefined || Object.keys(sizeInventory).length > 0;
                    const totalStock = hasInventoryData 
                      ? (override?.inventory ?? Object.values(sizeInventory).reduce((a, b) => a + b, 0))
                      : 45; // Default stock when no data exists
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <img src={product.images[0]?.url} alt="" className="w-12 h-16 object-cover rounded shadow-sm border" />
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {override?.itemNumber || '-'}
                        </TableCell>
                        <TableCell className="font-medium font-sans text-sm">{product.title}</TableCell>
                        <TableCell>
                          <Select
                            value={override?.category || 'Other'}
                            onValueChange={(value) => moveProductToCategory(product.id, value)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-[10px] font-sans uppercase tracking-widest bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                                <SelectItem key={cat} value={cat} className="text-sm font-sans">
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap max-w-[80px]">
                            {override?.colorCodes?.length ? (
                              override.colorCodes.map((color, i) => (
                                <div
                                  key={i}
                                  className="w-5 h-5 rounded border border-border shadow-sm"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                            {sizes.map(s => {
                              // Use sizeInventory if available, otherwise distribute default stock evenly
                              const stock = Object.keys(sizeInventory).length > 0 
                                ? (sizeInventory[s] ?? 0)
                                : Math.floor(totalStock / sizes.length);
                              const colorClass = stock === 0 
                                ? 'bg-red-100 text-red-700 border-red-200' 
                                : stock <= 5 
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                              
                              return (
                                <span 
                                  key={s} 
                                  className={`px-2 py-1 rounded-md border text-xs font-semibold ${colorClass}`}
                                >
                                  {s}: {stock}
                                </span>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="font-sans text-sm font-medium">
                          {product.price.currencyCode} {parseFloat(product.price.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-sans tracking-widest uppercase font-medium w-fit ${
                              totalStock > 0 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {totalStock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                            <span className="text-[10px] font-sans text-muted-foreground uppercase tracking-tighter">
                              {totalStock} total units
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            const sizes = product.options.find(o => o.name === 'Size')?.values || [];
                            const override = productOverrides[product.id];
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
                              id: product.id,
                              title: product.title,
                              price: product.price.amount,
                              inventory: override?.inventory || 45,
                              sizeInventory: sizeInventory,
                              image: product.images[0]?.url,
                              description: product.description || "",
                              sizes: sizes,
                              category: override?.category,
                              itemNumber: override?.itemNumber,
                              colorCodes: override?.colorCodes || []
                            });
                          }}>
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/5" onClick={() => setProductToDelete(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Dialog open={!!editingProduct} onOpenChange={(open) => {
              if (!open) {
                setEditingProduct(null);
                setIsAddingProduct(false);
              }
            }}>
              <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle className="font-serif text-2xl">{isAddingProduct ? 'Add New Product' : 'Edit Product'}</DialogTitle>
                  <DialogDescription className="font-sans text-sm text-muted-foreground">
                    {isAddingProduct ? 'Enter the details for the new product.' : 'Make changes to your product here. Click save when you\'re done.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="itemNumber" className="text-right font-sans text-[10px] uppercase tracking-widest">Item #</Label>
                    <Input
                      id="itemNumber"
                      placeholder="e.g., LB-001"
                      value={editingProduct?.itemNumber || ""}
                      onChange={(e) => setEditingProduct({...editingProduct, itemNumber: e.target.value})}
                      className="col-span-3 font-sans text-sm font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right font-sans text-[10px] uppercase tracking-widest">Category</Label>
                    <Select
                      value={editingProduct?.category || 'Other'}
                      onValueChange={(value) => setEditingProduct({...editingProduct, category: value})}
                    >
                      <SelectTrigger className="col-span-3 font-sans text-sm bg-background">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {CATEGORIES.filter(c => c !== 'All').map(cat => (
                          <SelectItem key={cat} value={cat} className="text-sm font-sans">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right font-sans text-[10px] uppercase tracking-widest pt-2">Colors</Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        {editingProduct?.colorCodes?.map((color, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <input 
                              type="color" 
                              value={color}
                              onChange={(e) => {
                                const newColors = [...(editingProduct.colorCodes || [])];
                                newColors[i] = e.target.value;
                                setEditingProduct({...editingProduct, colorCodes: newColors});
                              }}
                              className="w-8 h-8 rounded cursor-pointer border border-border"
                            />
                            <button 
                              onClick={() => {
                                const newColors = editingProduct.colorCodes?.filter((_, idx) => idx !== i) || [];
                                setEditingProduct({...editingProduct, colorCodes: newColors});
                              }}
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add color (e.g., #FFD700)"
                          value={newColorInput}
                          onChange={(e) => setNewColorInput(e.target.value)}
                          className="text-sm font-mono"
                        />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            if (newColorInput.trim()) {
                              const colorValue = newColorInput.trim().startsWith('#') 
                                ? newColorInput.trim() 
                                : `#${newColorInput.trim()}`;
                              setEditingProduct({
                                ...editingProduct, 
                                colorCodes: [...(editingProduct?.colorCodes || []), colorValue]
                              });
                              setNewColorInput('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
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
                </div>
                <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
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

            <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif">Delete {selectedProducts.size} products?</AlertDialogTitle>
                  <AlertDialogDescription className="font-sans">
                    This action cannot be undone. This will permanently delete {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} from your store inventory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-sans text-[10px] uppercase tracking-widest">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={bulkDelete} className="bg-destructive hover:bg-destructive/90 font-sans text-[10px] uppercase tracking-widest text-white">
                    Delete {selectedProducts.size} Products
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

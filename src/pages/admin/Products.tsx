import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Edit2, Trash2, Upload, Loader2, Sparkles, Download, MoveRight, RefreshCw, Package, Eye, EyeOff, XCircle } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useSpreadsheetSync } from '@/hooks/useSpreadsheetSync';
import { useProductsDb } from '@/hooks/useProductsDb';

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
  const { data: initialProducts, isLoading } = useProducts(1000, undefined, true);
  const { productOverrides, updateProductOverride, deleteProduct, _hasHydrated } = useAdminStore();
  const { isUploading, handleFileUpload, downloadTemplate, fileInputRef: syncInputRef } = useSpreadsheetSync();
  const { fetchProducts, upsertProduct, deleteProductDb, bulkDeleteProducts } = useProductsDb();
  
  const settings = useAdminStore(state => state.settings);
  const [editingProduct, setEditingProduct] = useState<Partial<ProductOverride> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [newColorInput, setNewColorInput] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Count products by category
  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = { 
      All: 0, 
      Top: 0, 
      Bottom: 0, 
      'Top & Bottom': 0, 
      'One-Piece': 0, 
      Other: 0 
    };
    if (!initialProducts) return counts;
    
    initialProducts.forEach(p => {
      const override = productOverrides[p.id];
      counts.All++;
      
      // Use override category if set, otherwise derive from productType or product category
      const explicitCategory = override?.category || p.category;
      const type = (p.productType || '').toLowerCase();
      
      let category: string;
      if (explicitCategory && counts[explicitCategory] !== undefined) {
        category = explicitCategory;
      } else if (type.includes('one-piece') || type.includes('onepiece')) {
        category = 'One-Piece';
      } else if (type.includes('top & bottom') || type.includes('top and bottom')) {
        category = 'Top & Bottom';
      } else if (type.includes('top') && !type.includes('bottom')) {
        category = 'Top';
      } else if (type.includes('bottom') && !type.includes('top')) {
        category = 'Bottom';
      } else {
        category = 'Other';
      }
      
      counts[category]++;
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
        const explicitCategory = override?.category || p.category;
        const type = (p.productType || '').toLowerCase();
        
        let category: string;
        if (explicitCategory && ['Top', 'Bottom', 'Top & Bottom', 'One-Piece', 'Other'].includes(explicitCategory)) {
          category = explicitCategory;
        } else if (type.includes('one-piece') || type.includes('onepiece')) {
          category = 'One-Piece';
        } else if (type.includes('top & bottom') || type.includes('top and bottom')) {
          category = 'Top & Bottom';
        } else if (type.includes('top') && !type.includes('bottom')) {
          category = 'Top';
        } else if (type.includes('bottom') && !type.includes('top')) {
          category = 'Bottom';
        } else {
          category = 'Other';
        }
        
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
        <div className="pt-32 md:pt-40 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
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

  const confirmDelete = async () => {
    if (productToDelete) {
      // Optimistic update
      const idToDelete = productToDelete;
      deleteProduct(idToDelete);
      setProductToDelete(null);

      try {
        setIsSyncing(true);
        const success = await deleteProductDb(idToDelete);
        if (success) {
          toast.success("Product deleted successfully");
        } else {
          // Rollback not easily possible with current store structure without refetching
          // so we just fetch to be sure
          await fetchProducts();
          toast.error("Failed to delete product from database. Catalog refreshed.");
        }
      } catch (err) {
        console.error("Delete error:", err);
        await fetchProducts();
        toast.error("An unexpected error occurred. Catalog refreshed.");
      } finally {
        setIsSyncing(false);
      }
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

  const bulkDelete = async () => {
    const productIds = Array.from(selectedProducts);
    if (productIds.length === 0) return;

    // Optimistic update
    productIds.forEach(id => deleteProduct(id));
    setSelectedProducts(new Set());
    setShowBulkDeleteConfirm(false);

    try {
      setIsSyncing(true);
      const success = await bulkDeleteProducts(productIds);
      if (success) {
        toast.success(`${productIds.length} products deleted`);
      } else {
        await fetchProducts();
        toast.error("Failed to delete products from database. Catalog refreshed.");
      }
    } catch (err) {
      console.error("Bulk delete error:", err);
      await fetchProducts();
      toast.error("An error occurred. Catalog refreshed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const moveProductToCategory = async (productId: string, category: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingOverride = productOverrides[productId];
    const newOverride: ProductOverride = existingOverride
      ? { ...existingOverride, category } as ProductOverride
      : {
          id: productId,
          title: product.title,
          price: product.price.amount,
          image: product.images[0]?.url || '',
          description: product.description || '',
          productType: product.productType,
          inventory: 0,
          category,
        } as ProductOverride;

    // Optimistic update
    updateProductOverride(productId, newOverride);

    try {
      setIsSyncing(true);
      const success = await upsertProduct(newOverride);
      if (success) {
        toast.success(`Product moved to ${category}`);
      } else {
        await fetchProducts();
        toast.error("Failed to update database. Catalog refreshed.");
      }
    } catch (err) {
      await fetchProducts();
      toast.error("An error occurred. Catalog refreshed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleProductVisibility = async (productId: string) => {
    const product = (initialProducts || []).find(p => p.id === productId);
    if (!product) return;

    const existingOverride = productOverrides[productId];
    const currentStatus = existingOverride?.status || 'Active';
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    const newOverride: ProductOverride = existingOverride
      ? { ...existingOverride, status: newStatus } as ProductOverride
      : {
          id: productId,
          title: product.title,
          price: product.price.amount,
          image: product.images[0]?.url || '',
          description: product.description || '',
          productType: product.productType,
          inventory: 0,
          status: newStatus,
        } as ProductOverride;

    updateProductOverride(productId, newOverride);

    try {
      setIsSyncing(true);
      const success = await upsertProduct(newOverride);
      if (success) {
        toast.success(newStatus === 'Active' ? 'Product visible in store' : 'Product hidden from store');
      } else {
        await fetchProducts();
        toast.error("Failed to update visibility.");
      }
    } catch (err) {
      await fetchProducts();
      toast.error("An error occurred.");
    } finally {
      setIsSyncing(false);
    }
  };

  const bulkMoveToCategory = async (category: string) => {
    const productsToUpdate: ProductOverride[] = [];

    for (const id of selectedProducts) {
      const product = products.find(p => p.id === id);
      if (product) {
        const existingOverride = productOverrides[id];
        const newOverride: ProductOverride = existingOverride
          ? { ...existingOverride, category } as ProductOverride
          : {
              id: id,
              title: product.title,
              price: product.price.amount,
              image: product.images[0]?.url || '',
              description: product.description || '',
              productType: product.productType,
              inventory: 0,
              category,
            } as ProductOverride;

        productsToUpdate.push(newOverride);
      }
    }

    if (productsToUpdate.length === 0) return;

    // Optimistic update
    productsToUpdate.forEach(p => updateProductOverride(p.id, p));
    const count = productsToUpdate.length;
    setSelectedProducts(new Set());

    try {
      setIsSyncing(true);
      const results = await Promise.all(productsToUpdate.map(p => upsertProduct(p)));
      const success = results.every(Boolean);
      if (success) {
        toast.success(`${count} products moved to ${category}`);
      } else {
        await fetchProducts();
        toast.error("Failed to update database. Catalog refreshed.");
      }
    } catch (err) {
      await fetchProducts();
      toast.error("An error occurred. Catalog refreshed.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAiDescription = async () => {
    if (!editingProduct?.title?.trim()) {
      toast.error("Enter a product name first");
      return;
    }
    setIsAiGenerating(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Write a product description for: "${editingProduct.title}". Category: ${editingProduct.category || 'swimwear'}.` }],
          mode: 'product_description',
        }),
      });

      if (!resp.ok) {
        throw new Error('AI service error');
      }

      // Read streamed response
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No response');
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullText += content;
          } catch { /* skip */ }
        }
      }

      if (fullText) {
        setEditingProduct({ ...editingProduct, description: fullText.trim() });
        toast.success("AI description generated!");
      } else {
        toast.error("No description generated. Try again.");
      }
    } catch (err) {
      console.error('AI description error:', err);
      toast.error("Failed to generate description. Try again.");
    } finally {
      setIsAiGenerating(false);
    }
  };



  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImageUploading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const newImageUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${editingProduct?.id || 'new'}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          newImageUrls.push(urlData.publicUrl);
        }
      }

      if (newImageUrls.length > 0) {
        const currentImages = editingProduct?.images || [];
        const allImages = [...currentImages, ...newImageUrls].filter(Boolean);
        setEditingProduct(prev => prev ? {
          ...prev,
          images: allImages,
          image: allImages[0] || prev.image, // First image = primary
        } : null);
        toast.success(`${newImageUrls.length} image(s) uploaded!`);
      }
    } catch (err) {
      console.error('Image upload error:', err);
      toast.error('Failed to upload images');
    } finally {
      setIsImageUploading(false);
      // Reset input so the same file can be re-selected
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const currentImages = [...(editingProduct?.images || [])];
    currentImages.splice(index, 1);
    setEditingProduct(prev => prev ? {
      ...prev,
      images: currentImages,
      image: currentImages[0] || '',
    } : null);
  };

  const handleSave = async () => {
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
    
    // Optimistic update
    const productData = editingProduct as ProductOverride;
    updateProductOverride(productData.id, productData);
    const wasAdding = isAddingProduct;
    setEditingProduct(null);
    setIsAddingProduct(false);

    const savePromise = upsertProduct(productData);

    toast.promise(savePromise, {
      loading: wasAdding ? 'Adding new product...' : 'Saving changes...',
      success: (success) => {
        if (success) return wasAdding ? "Product added successfully!" : "Product updated successfully!";
        return "Database sync failed. Changes saved locally.";
      },
      error: "An unexpected error occurred while saving."
    });

    try {
      setIsSyncing(true);
      const success = await savePromise;
      if (!success) {
        await fetchProducts();
      }
    } catch (err) {
      console.error("Save error:", err);
      await fetchProducts();
    } finally {
      setIsSyncing(false);
    }
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
      image: "",
      images: [],
      description: "",
      sizes: [...PRODUCT_SIZES]
    });
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-32 md:pt-40 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
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
                  Download Spreadsheet
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
              <Table className="min-w-[1000px]">
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
                      <TableRow key={product.id} className={override?.status === 'Inactive' ? 'opacity-50' : ''}>
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
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleProductVisibility(product.id)}
                            title={override?.status === 'Inactive' ? 'Show in store' : 'Hide from store'}
                          >
                            {override?.status === 'Inactive' ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4" />}
                          </Button>
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
                              images: override?.images || product.images.map(img => img.url),
                              description: product.description || "",
                              sizes: sizes,
                              category: override?.category,
                              itemNumber: override?.itemNumber,
                              colorCodes: override?.colorCodes || [],
                              unitCost: override?.unitCost || '0.00',
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
              <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-6 pb-4 flex-shrink-0 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <DialogTitle className="font-serif text-3xl tracking-tight">
                      {isAddingProduct ? 'Add New Product' : 'Edit Product'}
                    </DialogTitle>
                  </div>
                  <DialogDescription className="font-sans text-sm text-muted-foreground ml-11">
                    {isAddingProduct
                      ? 'Create a new item for your luxury collection.'
                      : `Updating details for "${editingProduct?.title || 'this product'}"`}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-primary/10 hover:scrollbar-thumb-primary/20 transition-all">
                  {/* Basic Information Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10px] font-sans uppercase tracking-[0.2em] text-primary font-black">Basic Information</h3>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Product Name</Label>
                        <Input
                          id="name"
                          value={editingProduct?.title || ""}
                          onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                          placeholder="e.g., Silk Summer Top"
                          className="font-sans text-sm bg-secondary/10 border-border/50 focus:bg-background transition-all h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price" className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Selling Price (USD)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-sans">$</span>
                          <Input
                            id="price"
                            type="text"
                            value={editingProduct?.price || ""}
                            onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                            className="font-sans text-sm bg-secondary/10 border-border/50 focus:bg-background transition-all h-11 pl-7"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unitCost" className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Unit Cost (COGS)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-sans">$</span>
                          <Input
                            id="unitCost"
                            type="text"
                            value={editingProduct?.unitCost || "0.00"}
                            onChange={(e) => setEditingProduct({...editingProduct, unitCost: e.target.value})}
                            className="font-sans text-sm bg-secondary/10 border-border/50 focus:bg-background transition-all h-11 pl-7"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="itemNumber" className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Item # / SKU</Label>
                        <Input
                          id="itemNumber"
                          placeholder="e.g., NA-001"
                          value={editingProduct?.itemNumber || ""}
                          onChange={(e) => setEditingProduct({...editingProduct, itemNumber: e.target.value})}
                          className="font-sans text-sm font-mono bg-secondary/10 border-border/50 focus:bg-background transition-all h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Category</Label>
                        <Select
                          value={editingProduct?.category || 'Other'}
                          onValueChange={(value) => setEditingProduct({...editingProduct, category: value})}
                        >
                          <SelectTrigger className="font-sans text-sm bg-secondary/10 border-border/50 focus:bg-background transition-all h-11">
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
                    </div>
                  </section>

                  {/* Media & Description Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10px] font-sans uppercase tracking-[0.2em] text-primary font-black">Media & Description</h3>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1 space-y-3">
                        <Label className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Product Images</Label>
                        
                        {/* Image Gallery Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          {(editingProduct?.images || []).filter(Boolean).map((imgUrl, idx) => (
                            <div key={idx} className="relative group aspect-[3/4] rounded-xl overflow-hidden border border-border/50 shadow-sm">
                              <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                              {idx === 0 && (
                                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded font-bold">Primary</span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          
                          {/* Add Image Button */}
                          <div
                            className="aspect-[3/4] rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            {isImageUploading ? (
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            ) : (
                              <>
                                <Upload className="h-6 w-6 text-muted-foreground/40" />
                                <span className="text-[9px] uppercase tracking-widest font-sans text-muted-foreground/60">Add Photos</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                          ref={imageInputRef}
                        />
                      </div>

                      <div className="lg:col-span-2 space-y-3 flex flex-col">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="desc" className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Product Story / Description</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] uppercase tracking-widest font-black text-primary hover:text-primary hover:bg-primary/5 gap-2 px-3 rounded-full border border-primary/20"
                            onClick={handleAiDescription}
                            disabled={isAiGenerating}
                          >
                            {isAiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                            Magic AI Rewrite
                          </Button>
                        </div>
                        <Textarea
                          id="desc"
                          placeholder="Describe the elegance and craftsmanship of this piece..."
                          value={editingProduct?.description || ""}
                          onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                          className="flex-1 min-h-[180px] text-sm leading-relaxed font-sans bg-secondary/10 border-border/50 focus:bg-background transition-all resize-none p-4 rounded-xl"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Inventory Section */}
                  <section className="space-y-6">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[10px] font-sans uppercase tracking-[0.2em] text-primary font-black">Sizes & Availability</h3>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <Label className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Enabled Sizes</Label>
                        <div className="flex flex-wrap gap-2">
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
                              className={`h-10 w-12 flex items-center justify-center text-[10px] font-sans font-bold border-2 rounded-xl transition-all ${
                                editingProduct?.sizes?.includes(size)
                                  ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-110 z-10'
                                  : 'border-border/40 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>

                        <div className="pt-4 space-y-3">
                          <Label className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Color Palette</Label>
                          <div className="flex gap-2 flex-wrap min-h-[44px] items-center p-3 bg-secondary/10 rounded-xl border border-border/50">
                            {editingProduct?.colorCodes?.map((color, i) => (
                              <div key={i} className="flex items-center gap-1 group relative">
                                <div
                                  className="w-8 h-8 rounded-lg border border-white shadow-sm ring-1 ring-border cursor-pointer hover:scale-110 transition-transform"
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    // Could open a color picker here
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const newColors = editingProduct.colorCodes?.filter((_, idx) => idx !== i) || [];
                                    setEditingProduct({...editingProduct, colorCodes: newColors});
                                  }}
                                  className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <div className="flex gap-2 ml-auto">
                              <Input
                                placeholder="HEX code"
                                value={newColorInput}
                                onChange={(e) => setNewColorInput(e.target.value)}
                                className="h-8 w-24 text-[10px] font-mono bg-background border-border/50"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2 text-[10px] uppercase font-black"
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
                      </div>

                      <div className="space-y-4">
                        <Label className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold ml-1">Size-Specific Stock</Label>
                        <div className="grid grid-cols-2 gap-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin">
                          {editingProduct?.sizes?.map(size => (
                            <div key={size} className="flex flex-col gap-1.5 p-3 bg-secondary/5 rounded-xl border border-border/30 hover:border-primary/20 transition-colors">
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black font-sans text-primary/80 uppercase">{size}</span>
                                <span className={`text-[8px] font-sans font-bold uppercase ${
                                  (editingProduct.sizeInventory?.[size] || 0) > 0 ? 'text-emerald-600' : 'text-rose-500'
                                }`}>
                                  {(editingProduct.sizeInventory?.[size] || 0) > 0 ? 'In Stock' : 'Sold Out'}
                                </span>
                              </div>
                              <Input
                                type="number"
                                value={editingProduct.sizeInventory?.[size] ?? 0}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const valStr = e.target.value;
                                  const val = valStr === '' ? 0 : parseInt(valStr);
                                  if (isNaN(val) && valStr !== '') return;

                                  const newSizeInventory = {
                                    ...(editingProduct.sizeInventory || {}),
                                    [size]: isNaN(val) ? 0 : val
                                  };
                                  const newTotal = Object.values(newSizeInventory).reduce((acc, v) => acc + (v as number), 0);
                                  setEditingProduct({
                                    ...editingProduct,
                                    sizeInventory: newSizeInventory,
                                    inventory: newTotal
                                  });
                                }}
                                className="h-9 text-xs font-mono font-bold bg-background/80 border-border/30 focus:bg-background"
                              />
                            </div>
                          ))}
                          {(!editingProduct?.sizes || editingProduct.sizes.length === 0) && (
                            <div className="col-span-2 flex flex-col items-center justify-center py-8 text-muted-foreground/40 border-2 border-dashed border-border/20 rounded-2xl">
                              <Package className="h-6 w-6 mb-2 opacity-20" />
                              <span className="text-[10px] uppercase tracking-widest font-sans">Enable sizes above</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2">
                          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center shadow-sm">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground font-bold">Total Inventory</span>
                              <span className="text-2xl font-serif text-primary font-bold">{editingProduct?.inventory || 0} <span className="text-[10px] font-sans uppercase tracking-widest text-muted-foreground/60 font-black ml-1">Units</span></span>
                            </div>
                            <div className={`p-2 rounded-full ${ (editingProduct?.inventory || 0) > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <DialogFooter className="p-6 pt-4 border-t bg-secondary/10 flex-shrink-0 sticky bottom-0 z-10 backdrop-blur-md">
                  <div className="flex w-full sm:justify-end gap-3">
                    <Button
                      variant="outline"
                      disabled={isSyncing}
                      onClick={() => { setEditingProduct(null); setIsAddingProduct(false); }}
                      className="font-sans text-[10px] uppercase tracking-widest h-11 px-8 rounded-xl border-border/60 hover:bg-background hover:text-primary transition-all"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={isSyncing}
                      onClick={handleSave}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-[10px] uppercase tracking-widest h-11 px-10 rounded-xl shadow-gold hover:scale-105 active:scale-95 transition-all"
                    >
                      {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {isAddingProduct ? 'Create Product' : 'Save Changes'}
                    </Button>
                  </div>
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
                  <AlertDialogCancel disabled={isSyncing} className="font-sans text-[10px] uppercase tracking-widest">Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={isSyncing} onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 font-sans text-[10px] uppercase tracking-widest text-white">
                    {isSyncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
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
                  <AlertDialogCancel disabled={isSyncing} className="font-sans text-[10px] uppercase tracking-widest">Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={isSyncing} onClick={bulkDelete} className="bg-destructive hover:bg-destructive/90 font-sans text-[10px] uppercase tracking-widest text-white">
                    {isSyncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
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

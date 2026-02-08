import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Minus, Trash2, CreditCard, User, ShoppingBag, CheckCircle } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useAdminStore, type AdminOrder, type ProductOverride } from '@/stores/adminStore';
import { useOrdersDb } from '@/hooks/useOrdersDb';
import { useProductsDb } from '@/hooks/useProductsDb';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PosItem {
  id: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
  size: string;
}

export default function AdminPOS() {
  const { data: initialProducts } = useProducts(100);
  const { productOverrides, addOrder, settings, decrementInventory } = useAdminStore();
  const { upsertOrder } = useOrdersDb();
  const { upsertProduct } = useProductsDb();
  const [searchQuery, setSearchQuery] = useState('');
  const [posCart, setPosCart] = useState<PosItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectingProduct, setSelectingProduct] = useState<Product | null>(null);

  const products = useMemo(() => {
    if (!initialProducts) return [];

    const baseProducts = initialProducts.filter(p => !productOverrides[p.id]?.isDeleted);

    if (!searchQuery) return baseProducts;
    const q = searchQuery.toLowerCase();
    return baseProducts.filter(p => p.title.toLowerCase().includes(q));
  }, [initialProducts, productOverrides, searchQuery]);

  const addToCart = (product: Product) => {
    setSelectingProduct(product);
  };

  const confirmAddToCart = (product: Product, size: string) => {
    const existing = posCart.find(item => item.id === product.id && item.size === size);
    if (existing) {
      setPosCart(posCart.map(item =>
        (item.id === product.id && item.size === size) ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setPosCart([...posCart, {
        id: product.id,
        title: product.title,
        price: product.price.amount,
        image: product.images[0]?.url || 'https://images.unsplash.com/photo-1585924756944-b82af627eca9?q=80&w=200',
        quantity: 1,
        size: size
      }]);
    }
    playSound('click');
  };

  const removeFromCart = (id: string, size: string) => {
    setPosCart(posCart.filter(item => !(item.id === id && item.size === size)));
    playSound('remove');
  };

  const updateQuantity = (id: string, size: string, delta: number) => {
    playSound('click');
    setPosCart(posCart.map(item => {
      if (item.id === id && item.size === size) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = posCart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const taxAmount = subtotal * (settings.taxRate / 100);
  const cartTotal = subtotal + taxAmount;

  const completeSale = async () => {
    if (posCart.length === 0) return;

    setIsProcessing(true);

    try {
      // Decrement inventory and update DB for each item
      for (const item of posCart) {
        decrementInventory(item.id, item.size, item.quantity);

        // Get updated override to sync to DB
        const updatedOverride = useAdminStore.getState().productOverrides[item.id];
        if (updatedOverride) {
          await upsertProduct(updatedOverride);
        }
      }

      const newOrder: AdminOrder = {
        id: `#POS-${Math.floor(Math.random() * 9000) + 1000}`,
        customerName: 'In-Store Customer',
        customerEmail: 'pos@ninaarmend.co.site',
        date: new Date().toISOString().split('T')[0],
        total: cartTotal.toFixed(2),
        shippingCost: '0.00',
        itemCost: (subtotal * 0.3).toFixed(2), // Mock 30% COGS
        status: 'Pending',
        trackingNumber: 'In-Store Pickup',
        items: posCart.map(item => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
          size: item.size
        }))
      };

      addOrder(newOrder);
      await upsertOrder(newOrder);

      setIsProcessing(false);
      setShowSuccess(true);
      setPosCart([]);
      playSound('success');
      toast.success("Transaction completed successfully!");

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Sale error:", error);
      toast.error("Failed to complete transaction");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-32 md:pt-40 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-8 lg:gap-12">
          <AdminSidebar />

          <main className="flex-1 flex flex-col lg:flex-row gap-8 lg:h-[calc(100vh-280px)] lg:min-h-[600px]">
            <div className="flex-1 flex flex-col space-y-4">
              <div className="flex items-center gap-4 bg-card border rounded-xl px-4 py-3 shadow-sm">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm w-full font-sans"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <Card key={product.id} className="cursor-pointer hover:shadow-gold transition-all duration-300 group overflow-hidden border-border/50 hover:-translate-y-1 bg-background flex flex-col rounded-xl" onClick={() => addToCart(product)}>
                      <div className="aspect-[3/4] overflow-hidden relative bg-secondary/10">
                        <img
                          src={product.images[0]?.url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400'}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1585924756944-b82af627eca9?q=80&w=400';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-primary text-primary-foreground p-1.5 rounded-full shadow-lg">
                            <Plus className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-3 bg-background">
                        <p className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{product.productType}</p>
                        <p className="font-sans text-xs font-bold truncate mb-1">{product.title}</p>
                        <p className="font-serif text-sm text-primary">${parseFloat(product.price.amount).toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[400px] flex flex-col gap-4">
              <Card className="flex-1 flex flex-col border-primary/20 shadow-gold overflow-hidden">
                <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-lg">Current Sale</h2>
                  </div>
                  <span className="bg-primary text-primary-foreground text-[10px] font-sans px-2 py-0.5 rounded-full uppercase tracking-widest">{posCart.length} Items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {posCart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-muted-foreground">
                      <div className="p-4 bg-secondary/50 rounded-full">
                        <ShoppingBag className="h-8 w-8 opacity-20" />
                      </div>
                      <p className="font-sans text-sm">Cart is empty.<br/>Select products to begin sale.</p>
                    </div>
                  ) : (
                    posCart.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex items-center gap-3 bg-secondary/20 p-2 rounded-xl border border-border/50">
                        <img src={item.image} alt="" className="w-10 h-14 object-cover rounded shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-xs font-medium truncate">{item.title}</p>
                          <p className="font-sans text-[10px] uppercase tracking-wider text-muted-foreground">Size: {item.size}</p>
                          <p className="font-serif text-sm">${item.price}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-background rounded-lg border px-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.size, -1); }}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-sans text-xs w-4 text-center">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, item.size, 1); }}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeFromCart(item.id, item.size); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-6 bg-secondary/30 border-t space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-sans text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-sans text-muted-foreground">
                      <span>Tax ({settings.taxRate}%)</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-serif text-xl border-t pt-2 mt-2">
                      <span>Total</span>
                      <span className="text-primary">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-14 bg-primary text-primary-foreground font-sans uppercase tracking-widest text-xs shadow-lg relative overflow-hidden group"
                    disabled={posCart.length === 0 || isProcessing}
                    onClick={completeSale}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : showSuccess ? (
                      <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                        <CheckCircle className="h-4 w-4" />
                        <span>Success!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Complete Transaction</span>
                      </div>
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="p-4 border-border/50">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-[11px] font-sans uppercase tracking-widest">Guest Customer</span>
                  <Button variant="link" className="ml-auto text-[10px] uppercase tracking-widest h-auto p-0">Change</Button>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
      <Footer />

      <Dialog open={!!selectingProduct} onOpenChange={(open) => !open && setSelectingProduct(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Select Size</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-4">
            {selectingProduct?.options.find(o => o.name === 'Size')?.values.map(size => {
              // If product has an override with sizeInventory, use it.
              // Otherwise, if it has a total inventory override, distribute it (simple fallback).
              // Otherwise, fallback to a default stock of 15 for demo purposes.
              const override = productOverrides[selectingProduct.id];
              let stock = 15; // Default for mock products

              if (override) {
                if (override.sizeInventory && override.sizeInventory[size] !== undefined) {
                  stock = override.sizeInventory[size];
                } else if (override.inventory !== undefined) {
                  const sizes = selectingProduct.options.find(o => o.name === 'Size')?.values || [];
                  stock = Math.floor(override.inventory / (sizes.length || 1));
                }
              }

              return (
                <Button
                  key={size}
                  variant="outline"
                  disabled={stock <= 0}
                  className={`h-12 font-sans text-xs ${stock <= 0 ? 'opacity-50' : ''}`}
                  onClick={() => {
                    confirmAddToCart(selectingProduct, size);
                    setSelectingProduct(null);
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span>{size}</span>
                    <span className="text-[9px] text-muted-foreground">{stock} in stock</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

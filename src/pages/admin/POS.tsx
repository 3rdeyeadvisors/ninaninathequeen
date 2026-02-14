import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Minus, Trash2, CreditCard, User, ShoppingBag, CheckCircle, X, Loader2 } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useAdminStore, type AdminOrder, type ProductOverride } from '@/stores/adminStore';
import { useOrdersDb } from '@/hooks/useOrdersDb';
import { useProductsDb } from '@/hooks/useProductsDb';
import { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { playSound } from '@/lib/sounds';
import { getSupabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => {
        card: () => Promise<{
          attach: (selector: string) => Promise<void>;
          tokenize: () => Promise<{ status: string; token: string; errors?: Array<{ message: string }> }>;
          destroy: () => Promise<void>;
        }>;
      };
    };
  }
}

interface PosItem {
  id: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
  size: string;
}

interface PaymentData {
  method: 'cash' | 'card' | 'other';
  success: boolean;
  token?: string;
  customerName: string;
  customerEmail: string;
}

interface POSCheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: PosItem[];
  subtotal: number;
  onComplete: (paymentData: PaymentData) => Promise<void>;
}

function POSCheckoutDialog({ isOpen, onClose, items, subtotal, onComplete }: POSCheckoutDialogProps) {
  const { settings } = useAdminStore();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [customerName, setCustomerName] = useState('In-Store Customer');
  const [customerEmail, setCustomerEmail] = useState('pos@ninaarmend.co.site');
  const [isProcessing, setIsProcessing] = useState(false);
  const cardRef = useRef<{
    tokenize: () => Promise<{ status: string; token: string; errors?: Array<{ message: string }> }>;
    destroy: () => Promise<void>;
  } | null>(null);

  const total = subtotal;

  useEffect(() => {
    let isMounted = true;
    let cardInstance: { destroy: () => Promise<void> } | null = null;

    const squareAppId = import.meta.env.VITE_SQUARE_APPLICATION_ID || 'sandbox-sq0idb-LsqqMfOxi1tiVN7vVPYgew';
    const squareLocId = import.meta.env.VITE_SQUARE_LOCATION_ID || 'L09Y3ZCB23S11';

    if (paymentMethod === 'card' && isOpen && squareAppId && squareLocId) {
      const initializePayments = async () => {
        // Poll for Square SDK availability
        let attempts = 0;
        while (!window.Square && attempts < 10 && isMounted) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }

        if (!window.Square || !isMounted) return;

        try {
          const payments = window.Square.payments(squareAppId, squareLocId);
          const card = await payments.card();
          await card.attach('#card-container');

          if (isMounted) {
            cardRef.current = card;
            cardInstance = card;
          } else {
            card.destroy();
          }
        } catch (e) {
          console.error('Failed to initialize Square:', e);
          if (isMounted) toast.error('Failed to load payment form');
        }
      };

      initializePayments();
    }

    return () => {
      isMounted = false;
      if (cardInstance) {
        cardInstance.destroy().catch(console.error);
      }
    };
  }, [paymentMethod, isOpen]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      let paymentResult: { method: 'card' | 'cash' | 'other'; success: boolean; token?: string } = { method: paymentMethod, success: true };

      if (paymentMethod === 'card') {
        if (!cardRef.current) {
          throw new Error('Payment form not ready');
        }
        const result = await cardRef.current.tokenize();
        if (result.status !== 'OK') {
          throw new Error(result.errors?.[0]?.message || 'Card tokenization failed');
        }
        paymentResult = { ...paymentResult, token: result.token };
      }

      await onComplete({
        ...paymentResult,
        customerName,
        customerEmail
      });
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-primary/20 shadow-gold">
        <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
          <DialogTitle className="font-serif text-2xl">POS Checkout</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Customer Name</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="font-sans text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Email Address</Label>
              <Input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="font-sans text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Payment Method</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex flex-col h-20 gap-2 font-sans text-[10px] uppercase tracking-widest"
                onClick={() => setPaymentMethod('cash')}
              >
                <ShoppingBag className="h-5 w-5" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className="flex flex-col h-20 gap-2 font-sans text-[10px] uppercase tracking-widest"
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="h-5 w-5" />
                Card
              </Button>
              <Button
                variant={paymentMethod === 'other' ? 'default' : 'outline'}
                className="flex flex-col h-20 gap-2 font-sans text-[10px] uppercase tracking-widest"
                onClick={() => setPaymentMethod('other')}
              >
                <CheckCircle className="h-5 w-5" />
                Other
              </Button>
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="p-4 bg-secondary/20 rounded-xl border border-border/50 space-y-4">
              <div id="card-container" className="min-h-[100px]">
                {!window.Square && <p className="text-xs text-center text-muted-foreground py-8">Loading Secure Payment Gateway...</p>}
              </div>
            </div>
          )}

          <div className="bg-secondary/10 p-4 rounded-xl space-y-2 border border-border/30">
            <div className="flex justify-between text-sm font-sans">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-serif text-xl pt-2 border-t border-border/30 text-primary">
              <span>Total Due</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-secondary/5 border-t flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="flex-1 font-sans uppercase tracking-widest text-[10px]">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 font-sans uppercase tracking-widest text-[10px] bg-primary text-primary-foreground h-12"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Confirm & Pay $${total.toFixed(2)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  const [showCheckout, setShowCheckout] = useState(false);

  const products = useMemo(() => {
    if (!initialProducts) return [];

    const baseProducts = initialProducts;

    if (!searchQuery) return baseProducts;
    const q = searchQuery.toLowerCase();
    return baseProducts.filter(p => {
      const titleMatch = p.title.toLowerCase().includes(q);
      const skuMatch = (p as unknown as Record<string, unknown>).sku ? String((p as unknown as Record<string, unknown>).sku).toLowerCase().includes(q) : false;
      return titleMatch || skuMatch;
    });
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
  const cartTotal = subtotal;

  const completeSale = async (paymentData: PaymentData) => {
    setIsProcessing(true);

    try {
      if (paymentData.method === 'card' && paymentData.token) {
        const supabase = getSupabase();
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            sourceId: paymentData.token,
            amount: cartTotal.toFixed(2),
            currency: 'USD',
            locationId: 'L09Y3ZCB23S11',
            orderDetails: {
              customerName: paymentData.customerName,
              customerEmail: paymentData.customerEmail,
              items: posCart.map(item => ({
                title: item.title,
                quantity: item.quantity,
                price: item.price,
                size: item.size
              }))
            }
          }
        });

        if (error || !data.success) {
          throw new Error(error?.message || data?.error || 'Payment failed');
        }
      }

      // Decrement inventory and update DB
      for (const item of posCart) {
        decrementInventory(item.id, item.size, item.quantity);
        const updatedOverride = useAdminStore.getState().productOverrides[item.id];
        if (updatedOverride) {
          await upsertProduct(updatedOverride);
        }
      }

      const newOrder: AdminOrder = {
        id: `#POS-${Math.floor(Math.random() * 9000) + 1000}`,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        date: new Date().toISOString().split('T')[0],
        total: cartTotal.toFixed(2),
        shippingCost: '0.00',
        itemCost: (subtotal * 0.3).toFixed(2),
        status: 'Processing' as const,
        // paymentMethod stored in tracking notes
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
    } catch (error: unknown) {
      console.error("Sale error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to complete transaction";
      toast.error(errorMessage);
      setIsProcessing(false);
      throw error;
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
                    <div className="flex justify-between font-serif text-xl border-t pt-2 mt-2">
                      <span>Total</span>
                      <span className="text-primary">${cartTotal.toFixed(2)}</span>
                    </div>
                    
                  </div>

                  <Button
                    className="w-full h-14 bg-primary text-primary-foreground font-sans uppercase tracking-widest text-xs shadow-lg relative overflow-hidden group"
                    disabled={posCart.length === 0 || isProcessing}
                    onClick={() => setShowCheckout(true)}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
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
                        <span>Go to Checkout</span>
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
        <DialogContent className="sm:max-w-[400px] bg-background border-primary/20 shadow-gold">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Select Size</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-4">
            {selectingProduct?.options.find(o => o.name === 'Size')?.values.map(size => {
              const override = productOverrides[selectingProduct.id];
              let stock = 15;

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

      {showCheckout && (
        <POSCheckoutDialog
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          items={posCart}
          subtotal={subtotal}
          onComplete={completeSale}
        />
      )}
    </div>
  );
}

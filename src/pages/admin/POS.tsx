import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Minus, Trash2, CreditCard, User, ShoppingBag, CheckCircle } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useProducts, type ShopifyProduct } from '@/hooks/useProducts';
import { useAdminStore, type AdminOrder } from '@/stores/adminStore';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

interface PosItem {
  id: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
}

export default function AdminPOS() {
  const { data: initialProducts } = useProducts(100);
  const { productOverrides, addOrder } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [posCart, setPosCart] = useState<PosItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const products = useMemo(() => {
    if (!initialProducts) return [];

    const baseProducts = initialProducts.map(p => {
      const override = productOverrides[p.node.id];
      if (override) {
        return {
          ...p,
          node: {
            ...p.node,
            title: override.title,
            priceRange: {
              ...p.node.priceRange,
              minVariantPrice: { ...p.node.priceRange.minVariantPrice, amount: override.price }
            },
            images: {
              ...p.node.images,
              edges: [{ node: { url: override.image, altText: override.title } }]
            }
          }
        };
      }
      return p;
    }).filter(p => !productOverrides[p.node.id]?.isDeleted);

    if (!searchQuery) return baseProducts;
    const q = searchQuery.toLowerCase();
    return baseProducts.filter(p => p.node.title.toLowerCase().includes(q));
  }, [initialProducts, productOverrides, searchQuery]);

  const addToCart = (product: ShopifyProduct['node']) => {
    const existing = posCart.find(item => item.id === product.id);
    if (existing) {
      setPosCart(posCart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setPosCart([...posCart, {
        id: product.id,
        title: product.title,
        price: product.priceRange.minVariantPrice.amount,
        image: product.images.edges[0]?.node.url || '',
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (id: string) => {
    setPosCart(posCart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setPosCart(posCart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = posCart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

  const completeSale = () => {
    if (posCart.length === 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      const newOrder: AdminOrder = {
        id: `#POS-${Math.floor(Math.random() * 9000) + 1000}`,
        customerName: 'In-Store Customer',
        customerEmail: 'pos@ninaarmend.co.site',
        date: new Date().toISOString().split('T')[0],
        total: cartTotal.toFixed(2),
        status: 'Delivered',
        trackingNumber: 'Hand-delivered',
        items: posCart.map(item => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        }))
      };

      addOrder(newOrder);
      setIsProcessing(false);
      setShowSuccess(true);
      setPosCart([]);
      toast.success("Transaction completed successfully!");

      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">
          <AdminSidebar />

          <main className="flex-1 flex flex-col lg:flex-row gap-8 h-[calc(100vh-280px)] min-h-[600px]">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <Card key={product.node.id} className="cursor-pointer hover:shadow-md transition-shadow group overflow-hidden border-border/50" onClick={() => addToCart(product.node)}>
                      <div className="aspect-[3/4] overflow-hidden">
                        <img src={product.node.images.edges[0]?.node.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <CardContent className="p-3">
                        <p className="font-sans text-xs font-medium truncate">{product.node.title}</p>
                        <p className="font-serif text-sm text-primary">${parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}</p>
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
                      <div key={item.id} className="flex items-center gap-3 bg-secondary/20 p-2 rounded-xl border border-border/50">
                        <img src={item.image} alt="" className="w-10 h-14 object-cover rounded shadow-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-[11px] font-medium truncate">{item.title}</p>
                          <p className="font-serif text-xs">${item.price}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-background rounded-lg border px-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-sans text-xs w-4 text-center">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}>
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
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-sans text-muted-foreground">
                      <span>Tax (0%)</span>
                      <span>$0.00</span>
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
    </div>
  );
}

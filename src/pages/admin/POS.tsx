
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useProducts } from '@/hooks/useProducts';
import { useAdminStore } from '@/stores/adminStore';
import { toast } from 'sonner';
import { useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, User } from 'lucide-react';

export default function AdminPOS() {
  const { data: products } = useProducts(50);
  const { addOrder } = useAdminStore();
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');

  const filteredProducts = products?.filter(p =>
    p.node.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.node.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.node.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        id: product.node.id,
        title: product.node.title,
        price: product.node.priceRange.minVariantPrice.amount,
        quantity: 1,
        image: product.node.images.edges[0]?.node.url
      }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const tax = subtotal * 0.075;
  const total = subtotal + tax;

  const handleCompleteOrder = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    addOrder({
      customerName,
      total: `$${total.toFixed(2)}`,
      items: cart.map(item => ({
        title: item.title,
        price: item.price,
        quantity: item.quantity
      })),
      type: 'POS'
    });

    toast.success("Transaction completed successfully!");
    setCart([]);
    setCustomerName('Walk-in Customer');
  };

  return (
    <div className="min-h-screen bg-secondary/20">
      <Header />
      <div className="pt-40 md:pt-48 pb-12 max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="flex flex-col gap-4">
          <AdminSidebar />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Product Selection */}
            <main className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Inventory Selection</CardTitle>
                  <CardDescription>Select items to add to the customer's cart</CardDescription>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      placeholder="Search by product name..."
                      className="w-full bg-secondary/50 border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.node.id}
                        onClick={() => addToCart(product)}
                        className="group flex flex-col items-center p-3 rounded-xl border border-border/50 bg-background hover:border-primary/50 transition-all text-left"
                      >
                        <img
                          src={product.node.images.edges[0]?.node.url}
                          alt=""
                          className="w-full aspect-[3/4] object-cover rounded-lg mb-3 shadow-sm group-hover:scale-[1.02] transition-transform"
                        />
                        <p className="text-[11px] font-serif font-bold text-center mb-1 line-clamp-1">{product.node.title}</p>
                        <p className="text-[10px] text-primary font-bold">${parseFloat(product.node.priceRange.minVariantPrice.amount).toFixed(2)}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </main>

            {/* Checkout / Cart */}
            <aside className="space-y-6">
              <Card className="sticky top-48">
                <CardHeader className="border-b bg-primary/5">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="font-serif flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Cart
                    </CardTitle>
                    <Badge variant="outline" className="bg-background">{cart.length} Items</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-background rounded-lg border">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <input
                      className="bg-transparent border-none outline-none text-xs w-full"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 pr-2">
                    {cart.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground italic text-sm">
                        Cart is currently empty.
                      </div>
                    ) : cart.map((item) => (
                      <div key={item.id} className="flex gap-3 items-center">
                        <img src={item.image} alt="" className="w-12 h-16 object-cover rounded border" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold truncate">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground">${item.price}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tax (7.5%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-6 bg-primary py-6 text-[10px] uppercase tracking-[0.2em] font-bold"
                    onClick={handleCompleteOrder}
                    disabled={cart.length === 0}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Complete Transaction
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

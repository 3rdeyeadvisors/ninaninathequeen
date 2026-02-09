import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/stores/cartStore';
import { useAdminStore } from '@/stores/adminStore';
import { getSupabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    Square: {
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

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { settings } = useAdminStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const cardRef = useRef<{
    tokenize: () => Promise<{ status: string; token: string; errors?: Array<{ message: string }> }>;
    destroy: () => Promise<void>;
  } | null>(null);

  // Shipping form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States'
  });

  const subtotal = getTotal();
  const topsCount = items.filter(i => i.product.productType === 'Top').reduce((sum, i) => sum + i.quantity, 0);
  const bottomsCount = items.filter(i => i.product.productType === 'Bottom').reduce((sum, i) => sum + i.quantity, 0);
  const onePiecesCount = items.filter(i => i.product.productType === 'One-Piece').reduce((sum, i) => sum + i.quantity, 0);
  const totalSets = Math.min(topsCount, bottomsCount) + onePiecesCount;
  const freeShipping = totalSets >= 2;
  const shippingCost = freeShipping ? 0 : 12.50;
  const taxRate = settings.taxRate / 100;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;

  const handlePayment = async () => {
    if (!cardRef.current) {
      toast.error('Payment form not ready');
      return;
    }

    if (!formData.email || !formData.address || !formData.firstName || !formData.lastName) {
      toast.error('Please fill in all shipping details');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await cardRef.current.tokenize();
      if (result.status === 'OK') {
        const supabase = getSupabase();

        const orderId = `#ORD-${Math.floor(Math.random() * 9000) + 1000}`;
        const orderDetails = {
          id: orderId,
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          items: items.map(item => ({
            title: item.product.title,
            quantity: item.quantity,
            price: item.price.amount,
            image: item.product.images[0]?.url || '',
            size: item.variantTitle
          })),
          shippingCost: shippingCost.toFixed(2),
          itemCost: (subtotal * 0.3).toFixed(2), // Mock 30% COGS
        };

        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            sourceId: result.token,
            amount: total.toFixed(2),
            currency: items[0]?.price.currencyCode || 'USD',
            locationId: settings.squareLocationId,
            orderDetails
          }
        });

        if (error || !data.success) {
          throw new Error(error?.message || data?.error || 'Payment failed');
        }

        toast.success('Payment successful!');
        clearCart();
        navigate('/checkout/success');
      } else {
        throw new Error(result.errors?.[0]?.message || 'Tokenization failed');
      }
    } catch (err: unknown) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during payment';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!settings.squareApplicationId || !settings.squareLocationId) {
      return;
    }

    let isMounted = true;
    let cardInstance: { destroy: () => Promise<void> } | null = null;

    const initializePayments = async () => {
      // Poll for Square SDK availability (up to 5 seconds)
      let attempts = 0;
      while (!window.Square && attempts < 10 && isMounted) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!window.Square || !isMounted) {
        if (!window.Square && isMounted) {
          console.error('Square.js not loaded');
          toast.error('Payment system failed to load. Please refresh the page.');
        }
        return;
      }

      try {
        const payments = window.Square.payments(settings.squareApplicationId, settings.squareLocationId);
        const card = await payments.card();
        await card.attach('#card-container');

        if (isMounted) {
          cardRef.current = card;
          cardInstance = card;

          const container = document.getElementById('card-container');
          if (container) {
            const p = container.querySelector('p');
            if (p) p.remove();
          }
        } else {
          card.destroy();
        }
      } catch (e) {
        console.error('Failed to initialize Square:', e);
        if (isMounted) {
          toast.error('Failed to load payment form');
        }
      }
    };

    initializePayments();

    return () => {
      isMounted = false;
      if (cardInstance) {
        cardInstance.destroy().catch(console.error);
      }
    };
  }, [settings.squareApplicationId, settings.squareLocationId]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 md:pt-40 pb-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-3xl mb-4">Your bag is empty</h1>
            <Button onClick={() => navigate('/shop')}>Go to Shop</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <Button
            variant="ghost"
            className="mb-8 font-sans text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Column: Forms */}
            <div className="lg:col-span-7 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="state">State / Province</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => setFormData({...formData, state: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="zip">ZIP / Postal Code</Label>
                        <Input
                          id="zip"
                          value={formData.zip}
                          onChange={(e) => setFormData({...formData, zip: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData({...formData, country: e.target.value})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="border-primary/20 shadow-gold overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="font-serif text-2xl">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div id="card-container" className="min-h-[150px] flex items-center justify-center bg-secondary/20 rounded-lg border border-border/50">
                      {/* Square Payment Form will be mounted here */}
                      <p className="text-muted-foreground text-sm font-sans">Initialising secure payment gateway...</p>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-6 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-[10px] uppercase tracking-widest">Secure SSL</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <span className="text-[10px] uppercase tracking-widest">Insured Delivery</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-32">
                <Card className="border-border/50 bg-secondary/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {items.map((item) => (
                        <div key={item.variantId} className="flex gap-4">
                          <div className="h-20 w-16 shrink-0 bg-muted rounded-md overflow-hidden border border-border/30">
                            <img
                              src={item.product.images[0]?.url}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-sans text-sm font-medium truncate">{item.product.title}</h4>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                              Size: {item.variantTitle} / Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-serif text-primary mt-1">
                              ${(parseFloat(item.price.amount) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 pt-6 border-t border-border/30">
                      <div className="flex justify-between text-sm font-sans">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-sans">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className={shippingCost === 0 ? 'text-emerald-500 font-medium' : ''}>
                          {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-sans">
                        <span className="text-muted-foreground">Tax ({settings.taxRate}%)</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-serif pt-4 border-t border-border/30">
                        <span>Total</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      id="card-button"
                      className="w-full h-14 bg-primary text-primary-foreground font-sans uppercase tracking-widest text-xs shadow-lg group relative overflow-hidden"
                      disabled={isProcessing}
                      onClick={handlePayment}
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <span>Pay ${total.toFixed(2)}</span>
                      )}
                    </Button>

                    <p className="text-[10px] text-center text-muted-foreground leading-relaxed mt-4">
                      By completing your purchase, you agree to NINA ARMEND's
                      <br />
                      <Link to="/terms" className="underline hover:text-primary">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

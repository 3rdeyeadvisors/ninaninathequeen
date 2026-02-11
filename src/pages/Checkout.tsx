import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/stores/cartStore';
import { useAdminStore } from '@/stores/adminStore';
import { getSupabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, Truck, ArrowLeft, CreditCard, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal } = useCartStore();
  const { settings } = useAdminStore();

  const [isProcessing, setIsProcessing] = useState(false);

  // Contact info state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const subtotal = getTotal();
  const topsCount = items.filter(i => i.product.productType === 'Top').reduce((sum, i) => sum + i.quantity, 0);
  const bottomsCount = items.filter(i => i.product.productType === 'Bottom').reduce((sum, i) => sum + i.quantity, 0);
  const onePiecesCount = items.filter(i => i.product.productType === 'One-Piece').reduce((sum, i) => sum + i.quantity, 0);
  const totalSets = Math.min(topsCount, bottomsCount) + onePiecesCount;
  const freeShipping = totalSets >= 2;
  const shippingCost = freeShipping ? 0 : 12.50;
  const taxRate = (settings.taxRate || 7.5) / 100;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;

  const validateContact = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.firstName || !formData.lastName) {
      toast.error('Please enter your full name');
      return false;
    }
    return true;
  };

  const handleCreateCheckoutSession = async () => {
    if (!validateContact()) return;

    setIsProcessing(true);
    try {
      const supabase = getSupabase();
      const orderId = `#ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const orderDetails = {
        id: orderId,
        customerName: `${formData.firstName} ${formData.lastName}`,
        customerEmail: formData.email,
        items: items.map(item => ({
          productId: item.product.id,
          variantId: item.variantId,
          title: item.product.title,
          quantity: item.quantity,
          price: item.price.amount,
          image: item.product.images[0]?.url || '',
          size: item.selectedOptions.find(o => o.name.toLowerCase() === 'size')?.value || item.variantTitle
        })),
        shippingCost: shippingCost.toFixed(2),
        itemCost: (subtotal * 0.3).toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        total: total.toFixed(2)
      };

      const { data, error } = await supabase.functions.invoke('create-square-checkout', {
        body: {
          orderDetails,
          locationId: settings.squareLocationId
        }
      });

      if (error || !data.success) {
        throw new Error(error?.message || data?.error || 'Failed to initialize checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err: any) {
      console.error('Checkout session error:', err);
      toast.error(err.message || 'An error occurred while initiating checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <CheckoutHeader />
        <main className="flex-1 pt-32 md:pt-40 pb-20 flex items-center">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-3xl mb-4">Your bag is empty</h1>
            <Button onClick={() => navigate('/shop')}>Go to Shop</Button>
          </div>
        </main>
        <CheckoutFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CheckoutHeader />
      <main className="flex-1 pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <Button
            variant="ghost"
            className="mb-8 font-sans text-xs uppercase tracking-widest text-muted-foreground hover:text-primary p-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to shop
          </Button>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Column: Contact Info */}
            <div className="lg:col-span-7 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div className="mb-8">
                  <h1 className="font-serif text-3xl mb-2">Checkout</h1>
                  <p className="text-muted-foreground font-sans text-sm tracking-wide">Enter your contact details to proceed to secure payment and shipping.</p>
                </div>

                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="firstName" className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          placeholder="Jane"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="jane@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="pt-4">
                  <Button
                    onClick={handleCreateCheckoutSession}
                    disabled={isProcessing}
                    className="w-full h-14 bg-primary text-primary-foreground font-sans uppercase tracking-widest text-xs shadow-lg group relative overflow-hidden"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Initializing Secure Payment...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Proceed to Payment — ${total.toFixed(2)}</span>
                      </div>
                    )}
                  </Button>
                  <p className="mt-4 text-[10px] text-center text-muted-foreground font-sans uppercase tracking-widest flex items-center justify-center gap-2">
                    <ShieldCheck className="h-3 w-3" />
                    Secure Checkout by Square
                  </p>
                </div>

                <div className="bg-secondary/20 rounded-xl p-6 border border-border/30">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-sans text-xs font-bold uppercase tracking-widest mb-1">Worldwide Shipping</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                        You will provide your shipping address on the next secure page. We offer complimentary express shipping on orders of 2+ bikini sets.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-8 py-6 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Insured Shipping</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-32">
                <Card className="border-border/50 bg-secondary/10 backdrop-blur-sm shadow-sm">
                  <CardHeader className="pb-4">
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
                        <span className="text-muted-foreground">Estimated Tax</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-serif pt-4 border-t border-border/30">
                        <span>Total</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground leading-relaxed font-sans px-4">
                      By completing your purchase, you agree to NINA ARMEND's
                      <br />
                      <Link to="/terms" className="underline hover:text-primary transition-colors">Terms of Service</Link> and <Link to="/privacy" className="underline hover:text-primary transition-colors">Privacy Policy</Link>.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <CheckoutFooter />
    </div>
  );
}

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
import { Loader2, ShieldCheck, Truck, ArrowLeft, CheckCircle2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SquareTokenizeResult {
  status: string;
  token: string;
  errors?: Array<{ message: string }>;
}

interface SquarePaymentMethod {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<SquareTokenizeResult>;
  destroy: () => Promise<void>;
  addEventListener: (event: string, callback: (event: any) => void) => void;
}

interface SquarePayments {
  card: () => Promise<SquarePaymentMethod>;
  applePay: (paymentRequest: any) => Promise<SquarePaymentMethod>;
  googlePay: (paymentRequest: any) => Promise<SquarePaymentMethod>;
  cashAppPay: (paymentRequest: any, options?: any) => Promise<SquarePaymentMethod>;
  paymentRequest: (options: any) => any;
}

declare global {
  interface Window {
    Square: {
      payments: (appId: string, locationId: string) => SquarePayments;
    };
  }
}

type CheckoutStep = 'shipping' | 'payment';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotal, clearCart } = useCartStore();
  const { settings } = useAdminStore();

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSdkLoading, setIsSdkLoading] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const cardRef = useRef<SquarePaymentMethod | null>(null);

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
  const taxRate = (settings.taxRate || 7.5) / 100;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + shippingCost + taxAmount;

  const validateShipping = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!formData.firstName || !formData.lastName || !formData.address || !formData.city || !formData.state || !formData.zip) {
      toast.error('Please fill in all required shipping fields');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateShipping()) {
      setCheckoutStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const processPayment = async (token: string) => {
    setIsProcessing(true);

    try {
      const supabase = getSupabase();
      const orderId = `#ORD-${Math.floor(Math.random() * 9000) + 1000}`;
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
      };

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          sourceId: token,
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
      return true;
    } catch (err: unknown) {
      console.error('Payment error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during payment';
      toast.error(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentResponse = async (result: SquareTokenizeResult) => {
    if (result.status === 'OK') {
      await processPayment(result.token);
    } else {
      console.error('Tokenization failed:', result.errors);
      toast.error(result.errors?.[0]?.message || 'Payment tokenization failed');
    }
  };

  const handleCardPayment = async () => {
    if (!cardRef.current) {
      toast.error('Payment form not ready. Please try again or refresh.');
      return;
    }
    const result = await cardRef.current.tokenize();
    await handlePaymentResponse(result);
  };

  useEffect(() => {
    if (checkoutStep !== 'payment') return;

    if (!settings.squareApplicationId || !settings.squareLocationId) {
      setSdkError('Payment gateway not configured. Please contact the administrator.');
      return;
    }

    let isMounted = true;
    const instances: SquarePaymentMethod[] = [];

    const initializePayments = async () => {
      setIsSdkLoading(true);
      setSdkError(null);

      let attempts = 0;
      while (!window.Square && attempts < 10 && isMounted) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!window.Square || !isMounted) {
        if (isMounted) setSdkError('Failed to load secure payment gateway. Please check your connection and refresh.');
        setIsSdkLoading(false);
        return;
      }

      try {
        const payments = window.Square.payments(settings.squareApplicationId, settings.squareLocationId);

        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: {
            amount: total.toFixed(2),
            label: 'Total',
          },
        });

        // Initialize Card
        const card = await payments.card();
        await card.attach('#card-container');
        if (isMounted) {
          cardRef.current = card;
          instances.push(card);
        } else {
          card.destroy();
        }

        // Initialize Apple Pay
        try {
          const applePay = await payments.applePay(paymentRequest);
          if (document.getElementById('apple-pay-container')) {
            await applePay.attach('#apple-pay-container');
            instances.push(applePay);
            applePay.addEventListener('tokenization', (event: { detail: SquareTokenizeResult }) => {
              handlePaymentResponse(event.detail);
            });
          }
        } catch (e) {
          console.log('Apple Pay not supported:', e);
        }

        // Initialize Google Pay
        try {
          const googlePay = await payments.googlePay(paymentRequest);
          if (document.getElementById('google-pay-container')) {
            await googlePay.attach('#google-pay-container');
            instances.push(googlePay);
            googlePay.addEventListener('tokenization', (event: { detail: SquareTokenizeResult }) => {
              handlePaymentResponse(event.detail);
            });
          }
        } catch (e) {
          console.log('Google Pay not supported:', e);
        }

        // Initialize Cash App Pay
        try {
          const cashAppPay = await payments.cashAppPay(paymentRequest, {
            redirectURL: window.location.href,
            referenceId: `REF-${Math.floor(Math.random() * 90000) + 10000}`
          });
          if (document.getElementById('cash-app-pay-container')) {
            await cashAppPay.attach('#cash-app-pay-container');
            instances.push(cashAppPay);
            cashAppPay.addEventListener('tokenization', (event: { detail: SquareTokenizeResult }) => {
              handlePaymentResponse(event.detail);
            });
          }
        } catch (e) {
          console.log('Cash App Pay not supported:', e);
        }

        if (isMounted) setIsSdkLoading(false);

      } catch (e) {
        console.error('Failed to initialize Square:', e);
        if (isMounted) {
          setSdkError('Failed to initialize payment gateway.');
          setIsSdkLoading(false);
        }
      }
    };

    initializePayments();

    return () => {
      isMounted = false;
      instances.forEach(instance => {
        if (instance.destroy) instance.destroy().catch(console.error);
      });
    };
  }, [checkoutStep, settings.squareApplicationId, settings.squareLocationId, total]);

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
            className="mb-8 font-sans text-xs uppercase tracking-widest text-muted-foreground hover:text-primary p-0"
            onClick={() => checkoutStep === 'payment' ? setCheckoutStep('shipping') : navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {checkoutStep === 'payment' ? 'Back to shipping' : 'Back to shop'}
          </Button>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className={`flex items-center gap-2 ${checkoutStep === 'shipping' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-serif text-sm ${checkoutStep === 'shipping' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                {checkoutStep === 'payment' ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold">Shipping</span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div className={`flex items-center gap-2 ${checkoutStep === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-serif text-sm ${checkoutStep === 'payment' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                2
              </div>
              <span className="font-sans text-[10px] uppercase tracking-[0.2em] font-bold">Payment</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12">
            {/* Left Column: Flow */}
            <div className="lg:col-span-7 space-y-8">
              <AnimatePresence mode="wait">
                {checkoutStep === 'shipping' ? (
                  <motion.div
                    key="shipping-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
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

                    <Button
                      onClick={handleNextStep}
                      className="w-full h-14 bg-primary text-primary-foreground font-sans uppercase tracking-widest text-xs shadow-lg group relative overflow-hidden"
                    >
                      <span>Continue to Payment</span>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="payment-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    <Card className="border-primary/20 shadow-gold overflow-hidden">
                      <CardHeader className="bg-primary/5 border-b border-primary/10">
                        <CardTitle className="font-serif text-2xl flex items-center gap-3">
                          <CreditCard className="h-6 w-6 text-primary" />
                          Payment Method
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        {/* Express Checkout Section */}
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-px bg-border flex-1" />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Express Checkout</span>
                            <div className="h-px bg-border flex-1" />
                          </div>
                          <div id="apple-pay-container" className="min-h-[48px]"></div>
                          <div id="google-pay-container" className="min-h-[48px]"></div>
                          <div id="cash-app-pay-container" className="min-h-[48px]"></div>
                        </div>

                        <div className="relative mb-8">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                          </div>
                          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                            <span className="bg-background px-4 text-muted-foreground">Or pay with card</span>
                          </div>
                        </div>

                        {sdkError ? (
                          <div className="p-8 text-center bg-destructive/5 rounded-lg border border-destructive/20 space-y-3">
                            <p className="text-sm text-destructive font-sans">{sdkError}</p>
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
                              Retry Initialization
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div id="card-container" className={`min-h-[120px] rounded-lg border border-border/50 p-4 transition-opacity duration-300 ${isSdkLoading ? 'opacity-0' : 'opacity-100'}`}>
                              {/* Square Payment Form mounted here */}
                            </div>

                            {isSdkLoading && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[1px] z-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                <p className="text-xs text-muted-foreground font-sans tracking-widest uppercase">Securing Connection...</p>
                              </div>
                            )}

                            <Button
                              className="w-full h-14 bg-primary text-primary-foreground font-sans uppercase tracking-widest text-xs shadow-lg group relative overflow-hidden mt-4"
                              disabled={isProcessing || isSdkLoading}
                              onClick={handleCardPayment}
                            >
                              {isProcessing ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>Processing...</span>
                                </div>
                              ) : (
                                <span>Complete Purchase — ${total.toFixed(2)}</span>
                              )}
                            </Button>
                          </div>
                        )}

                        <div className="mt-8 flex items-center justify-center gap-8 py-4 border-t border-border/30">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">SSL Encrypted</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-primary" />
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Insured Shipping</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Shipping Summary in Payment Step */}
                    <Card className="border-border/30 bg-secondary/5">
                      <CardContent className="p-4 flex items-center justify-between text-sm font-sans">
                        <div>
                          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-1">Shipping to</p>
                          <p className="font-medium">{formData.firstName} {formData.lastName}</p>
                          <p className="text-muted-foreground text-xs">{formData.address}, {formData.city}</p>
                        </div>
                        <Button variant="link" size="sm" onClick={() => setCheckoutStep('shipping')} className="text-primary text-xs uppercase tracking-widest font-bold">
                          Edit
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
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
                        <span className="text-muted-foreground">Estimated Tax</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-serif pt-4 border-t border-border/30">
                        <span>Total</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground leading-relaxed">
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

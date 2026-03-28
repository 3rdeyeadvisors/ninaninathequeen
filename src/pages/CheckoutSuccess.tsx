import { useEffect, useState, useRef } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Loader2, AlertCircle, Package, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/stores/cartStore';
import { getSupabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { useDbSync } from '@/providers/DbSyncProvider';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const metadataParam = searchParams.get('metadata');
  const { clearCart } = useCartStore();
  const { syncProducts, syncOrders } = useDbSync();
  const [isFinalizing, setIsFinalizing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finalOrderId, setFinalOrderId] = useState<string | null>(null);
  const hasFinalized = useRef(false);

  useEffect(() => {
    const finalizeOrder = async () => {
      if (hasFinalized.current) return;
      hasFinalized.current = true;

      // Clear cart immediately upon successful payment return
      clearCart();

      if (metadataParam) {
        try {
          const metadata = JSON.parse(decodeURIComponent(metadataParam));
          const supabase = getSupabase();

          // The redirect URL from Square includes the Square order ID as a query param
          // Square appends orderId to the redirect URL automatically
          const squareOrderId = searchParams.get('orderId');

          if (!squareOrderId) {
            setError('Missing Square order reference. Please contact support if you have been charged.');
            setIsFinalizing(false);
            return;
          }

          // Call the secure backend function to finalize and CREATE the order
          const { data, error: functionError } = await supabase.functions.invoke('finalize-square-order', {
            body: { squareOrderId, metadata }
          });

          if (functionError || !data?.success) {
            console.error('Error finalizing order:', functionError || data?.error);
            setError(data?.error || 'There was a problem verifying your payment. Please contact support if you have been charged.');
          } else {
            setFinalOrderId(data.orderId);
            // Re-sync products and orders so inventory is immediately up-to-date
            await Promise.all([syncProducts(), syncOrders()]);
          }
        } catch (err: any) {
          console.error('Unexpected error finalizing order:', err);
          setError('An unexpected error occurred. Please contact support if you have been charged.');
        } finally {
          setIsFinalizing(false);
        }
      } else {
        setIsFinalizing(false);
      }
    };

    finalizeOrder();
  }, [metadataParam, clearCart]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-32 md:pt-40 pb-20 flex items-center">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {isFinalizing ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </div>
                <h1 className="font-serif text-3xl">Verifying Your Order...</h1>
                <p className="text-muted-foreground">Please wait a moment while we confirm your payment and secure your items.</p>
              </div>
            ) : error ? (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                  </div>
                </div>
                <h1 className="font-serif text-3xl md:text-4xl mb-4">Payment Verification Needed</h1>
                <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                  {error}
                </p>
                <div className="flex justify-center gap-4">
                  <Button asChild size="lg" className="bg-primary">
                    <Link to="/contact">Contact Support</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/shop">Back to Shop</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 18 }}
                  className="flex justify-center mb-8"
                >
                  <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center ring-4 ring-primary/20">
                    <CheckCircle2 className="h-14 w-14 text-primary" />
                  </div>
                </motion.div>

                <h1 className="font-serif text-4xl md:text-5xl mb-3 tracking-tight">Order Confirmed</h1>
                <p className="text-muted-foreground text-lg mb-2">
                  Thank you for your order{finalOrderId ? ` — #${finalOrderId.slice(0, 8).toUpperCase()}` : ''}.
                </p>
                <p className="text-muted-foreground text-sm mb-10 leading-relaxed max-w-md mx-auto">
                  A confirmation email is on its way to you. Your order will be carefully prepared and shipped within 3–5 business days.
                </p>

                <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
                  {[
                    { icon: CheckCircle2, label: 'Order Confirmed', sub: 'Payment received' },
                    { icon: Package, label: 'Being Prepared', sub: '3–5 business days' },
                    { icon: Truck, label: 'Ships to You', sub: 'Tracking via email' },
                  ].map(({ icon: Icon, label, sub }, i) => (
                    <div key={i} className="flex flex-col items-center p-4 bg-secondary/20 rounded-2xl border border-border/40">
                      <Icon className="h-6 w-6 text-primary mb-2" />
                      <p className="text-xs font-bold uppercase tracking-widest">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4 max-w-sm mx-auto">
                  <Button asChild size="lg" className="w-full bg-primary py-6 font-sans uppercase tracking-widest text-xs">
                    <Link to="/shop">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Keep Shopping
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full py-6 font-sans uppercase tracking-widest text-xs">
                    <Link to="/account">View My Orders</Link>
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

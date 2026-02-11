import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/stores/cartStore';
import { getSupabase } from '@/lib/supabaseClient';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCartStore();

  useEffect(() => {
    const finalizeOrder = async () => {
      // Clear cart immediately upon successful payment return
      clearCart();

      if (orderId) {
        try {
          const supabase = getSupabase();

          // First check if the order is still 'Pending' to avoid double-processing on refresh
          const { data: currentOrder } = await supabase
            .from('orders')
            .select('status, items')
            .eq('id', orderId)
            .single();

          if (currentOrder && currentOrder.status === 'Pending') {
            // Update order status to Processing
            const { error: updateError } = await supabase
              .from('orders')
              .update({ status: 'Processing' })
              .eq('id', orderId);

            if (updateError) {
              console.error('Error updating order status:', updateError);
            } else {
              console.log('Order status updated to Processing');

              // Update inventory
              if (currentOrder.items && Array.isArray(currentOrder.items)) {
                for (const item of (currentOrder.items as any[])) {
                  try {
                    const { data: product, error: fetchError } = await supabase
                      .from('products')
                      .select('id, inventory, size_inventory')
                      .eq('id', item.productId)
                      .single();

                    if (!fetchError && product) {
                      const currentTotal = product.inventory || 0;
                      const newTotal = Math.max(0, currentTotal - item.quantity);
                      const sizeInventory = { ...(product.size_inventory as Record<string, number> || {}) };
                      const sizeKey = Object.keys(sizeInventory).find(k => k.toLowerCase() === item.size.toLowerCase()) || item.size;
                      sizeInventory[sizeKey] = Math.max(0, (sizeInventory[sizeKey] || 0) - item.quantity);

                      await supabase
                        .from('products')
                        .update({ inventory: newTotal, size_inventory: sizeInventory })
                        .eq('id', item.productId);
                    }
                  } catch (invErr) {
                    console.error('Inventory update error:', invErr);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Unexpected error finalizing order:', err);
        }
      }
    };

    finalizeOrder();
  }, [orderId, clearCart]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 md:pt-40 pb-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl mb-4 tracking-tight">Thank You For Your Order!</h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {orderId ? `Your order ${orderId} has been placed successfully.` : "Your order has been placed successfully."} We'll send you a confirmation email with your order details and tracking information once your package ships.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <Button asChild size="lg" className="w-full bg-primary py-6">
                <Link to="/shop">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full py-6">
                <Link to="/account">View Order Status</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

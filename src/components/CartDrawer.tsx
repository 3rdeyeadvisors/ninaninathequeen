import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingBag, Minus, Plus, Trash2, Loader2, Truck, CheckCircle2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useAdminStore } from "@/stores/adminStore";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { items, isLoading, updateQuantity, removeItem, clearCart } = useCartStore();
  const addAdminOrder = useAdminStore(state => state.addOrder);
  const { user } = useAuthStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);

  const topsCount = items.filter(i => i.product.productType === 'Top').reduce((sum, i) => sum + i.quantity, 0);
  const bottomsCount = items.filter(i => i.product.productType === 'Bottom').reduce((sum, i) => sum + i.quantity, 0);
  const onePiecesCount = items.filter(i => i.product.productType === 'One-Piece').reduce((sum, i) => sum + i.quantity, 0);

  const totalSets = Math.min(topsCount, bottomsCount) + onePiecesCount;
  const freeShippingEligible = totalSets >= 2;

  const handleCheckout = () => {
    // Create order in admin dashboard
    addAdminOrder({
      id: `#ORD-${Math.floor(Math.random() * 9000) + 1000}`,
      customerName: user?.name || 'Guest Customer',
      customerEmail: user?.email || null,
      date: new Date().toISOString().split('T')[0],
      total: totalPrice.toFixed(2),
      status: 'Pending',
      trackingNumber: 'Pending',
      shippingCost: freeShippingEligible ? '0.00' : '12.50',
      itemCost: (totalPrice * 0.3).toFixed(2),
      items: items.map(item => ({
        title: item.product.title,
        quantity: item.quantity,
        price: item.price.amount,
        image: item.product.images[0]?.url || '',
        size: item.variantTitle
      }))
    });

    toast.success("Order placed successfully!", {
      description: "Thank you for your purchase. You'll receive a confirmation email shortly."
    });
    
    clearCart();
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full bg-background border-border">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="font-serif text-2xl tracking-wider">Shopping Bag</SheetTitle>
          <SheetDescription className="font-sans">
            {totalItems === 0 ? "Your bag is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your bag`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground font-serif text-lg">Your bag is empty</p>
                <p className="text-sm text-muted-foreground mt-2">Add some beautiful pieces to get started</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 p-3 bg-card rounded-lg border border-border">
                      <div className="w-20 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] && (
                          <img 
                            src={item.product.images[0].url}
                            alt={item.product.title}
                            className="w-full h-full object-cover" 
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif text-lg truncate">{item.product.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.selectedOptions.map(option => option.value).join(' / ')}
                        </p>
                        <p className="text-primary font-semibold mt-1">
                          {item.price.currencyCode} {parseFloat(item.price.amount).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive" 
                          onClick={() => removeItem(item.variantId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7" 
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 space-y-4 pt-6 border-t border-border bg-background">
                {/* Shipping Progress */}
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                  <div className="flex items-center gap-3 mb-2">
                    {freeShippingEligible ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Truck className="h-5 w-5 text-primary" />
                    )}
                    <span className="text-sm font-medium">
                      {freeShippingEligible
                        ? "You've earned FREE SHIPPING!"
                        : `Add ${2 - totalSets} more bikini set${2 - totalSets !== 1 ? 's' : ''} for FREE SHIPPING`}
                    </span>
                  </div>
                  {!freeShippingEligible && (
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all duration-500"
                        style={{ width: `${(totalSets / 2) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-lg font-serif">Subtotal</span>
                  <span className="text-xl font-serif text-primary">
                    {items[0]?.price.currencyCode || 'USD'} {totalPrice.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Shipping and taxes calculated at checkout
                </p>
                <Button 
                  onClick={handleCheckout} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans tracking-wider" 
                  size="lg" 
                  disabled={items.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Complete Purchase'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

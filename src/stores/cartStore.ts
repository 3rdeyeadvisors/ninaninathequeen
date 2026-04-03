import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/hooks/useProducts';

export interface CartItem {
  lineId: string | null;
  product: Product;
  variantId: string;
  variantTitle: string;
  price: { amount: string; currencyCode: string };
  quantity: number;
  selectedOptions: Array<{ name: string; value: string }>;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  lastUpdated: number | null;
  userEmail: string | null;
  addItem: (item: Omit<CartItem, 'lineId'>) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  setUserEmail: (email: string | null) => void;
  checkAbandonedCart: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      lastUpdated: null,
      userEmail: null,

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);
        
        if (existingItem) {
          set({
            items: items.map(i => 
              i.variantId === item.variantId 
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
            lastUpdated: Date.now()
          });
        } else {
          set({
            items: [...items, { ...item, lineId: null }],
            lastUpdated: Date.now()
          });
        }
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        
        const { items } = get();
        set({
          items: items.map(i => 
            i.variantId === variantId ? { ...i, quantity } : i
          ),
          lastUpdated: Date.now()
        });
      },

      removeItem: (variantId) => {
        const { items } = get();
        const newItems = items.filter(i => i.variantId !== variantId);
        set({
          items: newItems,
          lastUpdated: Date.now()
        });
      },

      setUserEmail: (email) => set({ userEmail: email }),

      checkAbandonedCart: async () => {
        const { items, lastUpdated, userEmail } = get();
        if (!items.length || !userEmail || !lastUpdated) return;
        const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
        if (lastUpdated > twoHoursAgo) return;

        // Check if we already sent one for this exact cart state
        const cartDay = Math.floor(lastUpdated / 86400000); // calendar day of cart
        const sentKey = `abandoned_cart_sent_${userEmail}_${cartDay}`;
        const lastSent = localStorage.getItem(sentKey);
        if (lastSent) return;

        localStorage.setItem(sentKey, String(Date.now()));

        const { getSupabase } = await import('@/lib/supabaseClient');
        const supabase = getSupabase();
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'abandoned-cart',
            recipientEmail: userEmail,
            idempotencyKey: `abandoned-cart-${userEmail}-${Date.now()}`,
            templateData: {
              customerName: userEmail.split('@')[0],
              items: items.map(i => ({ title: i.product.title, quantity: i.quantity, price: i.price.amount })),
              total: items.reduce((sum, i) => sum + parseFloat(i.price.amount) * i.quantity, 0).toFixed(2),
            },
          }
        });
      },

      clearCart: () => set({ items: [] }),
      
      getTotal: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
      }
    }),
    {
      name: 'nina-armend-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        lastUpdated: state.lastUpdated,
        userEmail: state.userEmail
      }),
    }
  )
);


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
  addItem: (item: Omit<CartItem, 'lineId'>) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);
        
        if (existingItem) {
          set({
            items: items.map(i => 
              i.variantId === item.variantId 
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          });
        } else {
          set({ items: [...items, { ...item, lineId: null }] });
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
          )
        });
      },

      removeItem: (variantId) => {
        const { items } = get();
        const newItems = items.filter(i => i.variantId !== variantId);
        set({ items: newItems });
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
      partialize: (state) => ({ items: state.items }),
    }
  )
);


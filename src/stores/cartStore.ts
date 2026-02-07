import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  CartItem,
  ShopifyProduct,
  createShopifyCart,
  addLineToShopifyCart,
  updateShopifyCartLine,
  removeLineFromShopifyCart,
  storefrontApiRequest,
  CART_QUERY,
} from '@/lib/shopify';

interface CartStore {
  items: CartItem[];
  cartId: string | null;
  checkoutUrl: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  addItem: (item: Omit<CartItem, 'lineId'>) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  syncCart: () => Promise<void>;
  getCheckoutUrl: () => string | null;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cartId: null,
      checkoutUrl: null,
      isLoading: false,
      isSyncing: false,

      addItem: async (item) => {
        const { items, cartId, clearCart } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);
        
        set({ isLoading: true });
        try {
          if (!cartId) {
            const result = await createShopifyCart({ ...item, lineId: null });
            if (result) {
              set({
                cartId: result.cartId,
                checkoutUrl: result.checkoutUrl,
                items: [{ ...item, lineId: result.lineId }]
              });
            } else {
              // Fallback: add locally if Shopify fails
              set({ items: [{ ...item, lineId: null }] });
            }
          } else if (existingItem) {
            const newQuantity = existingItem.quantity + item.quantity;
            if (!existingItem.lineId) {
              // Item was previously added locally only, update locally
              set({ items: items.map(i => i.variantId === item.variantId ? { ...i, quantity: newQuantity } : i) });
              return;
            }
            const result = await updateShopifyCartLine(cartId, existingItem.lineId, newQuantity);
            if (result.success) {
              const currentItems = get().items;
              set({ items: currentItems.map(i => i.variantId === item.variantId ? { ...i, quantity: newQuantity } : i) });
            } else if (result.cartNotFound) {
              clearCart();
              set({ items: [{ ...item, lineId: null }] });
            } else {
              // Fallback: update locally
              const currentItems = get().items;
              set({ items: currentItems.map(i => i.variantId === item.variantId ? { ...i, quantity: newQuantity } : i) });
            }
          } else {
            const result = await addLineToShopifyCart(cartId, { ...item, lineId: null });
            if (result.success) {
              const currentItems = get().items;
              set({ items: [...currentItems, { ...item, lineId: result.lineId ?? null }] });
            } else if (result.cartNotFound) {
              clearCart();
              set({ items: [{ ...item, lineId: null }] });
            } else {
              // Fallback: add locally
              const currentItems = get().items;
              set({ items: [...currentItems, { ...item, lineId: null }] });
            }
          }
        } catch (error) {
          console.error('Failed to add item:', error);
          // Ultimate fallback: ensure it's at least added locally
          const { items: currentItems } = get();
          const existing = currentItems.find(i => i.variantId === item.variantId);
          if (existing) {
            set({ items: currentItems.map(i => i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i) });
          } else {
            set({ items: [...currentItems, { ...item, lineId: null }] });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      updateQuantity: async (variantId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(variantId);
          return;
        }
        
        const { items, cartId, clearCart } = get();
        const item = items.find(i => i.variantId === variantId);
        if (!item) return;

        // If not synced with Shopify, just update locally
        if (!item.lineId || !cartId) {
          set({ items: items.map(i => i.variantId === variantId ? { ...i, quantity } : i) });
          return;
        }

        set({ isLoading: true });
        try {
          const result = await updateShopifyCartLine(cartId, item.lineId, quantity);
          if (result.success) {
            const currentItems = get().items;
            set({ items: currentItems.map(i => i.variantId === variantId ? { ...i, quantity } : i) });
          } else if (result.cartNotFound) {
            clearCart();
            set({ items: items.map(i => i.variantId === variantId ? { ...i, quantity } : i) });
          } else {
            // Fallback: update locally
            set({ items: items.map(i => i.variantId === variantId ? { ...i, quantity } : i) });
          }
        } catch (error) {
          console.error('Failed to update quantity:', error);
          // Fallback: update locally
          set({ items: items.map(i => i.variantId === variantId ? { ...i, quantity } : i) });
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (variantId) => {
        const { items, cartId, clearCart } = get();
        const item = items.find(i => i.variantId === variantId);
        if (!item) return;

        // If not synced with Shopify, just remove locally
        if (!item.lineId || !cartId) {
          const newItems = items.filter(i => i.variantId !== variantId);
          if (newItems.length === 0) {
            clearCart();
          } else {
            set({ items: newItems });
          }
          return;
        }

        set({ isLoading: true });
        try {
          const result = await removeLineFromShopifyCart(cartId, item.lineId);
          if (result.success || result.cartNotFound) {
            if (result.cartNotFound) clearCart();

            const currentItems = get().items;
            const newItems = currentItems.filter(i => i.variantId !== variantId);
            if (newItems.length === 0) {
              clearCart();
            } else {
              set({ items: newItems });
            }
          } else {
            // Fallback: remove locally anyway
            const currentItems = get().items;
            const newItems = currentItems.filter(i => i.variantId !== variantId);
            set({ items: newItems });
          }
        } catch (error) {
          console.error('Failed to remove item:', error);
          // Fallback: remove locally
          const currentItems = get().items;
          const newItems = currentItems.filter(i => i.variantId !== variantId);
          set({ items: newItems });
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: () => set({ items: [], cartId: null, checkoutUrl: null }),
      getCheckoutUrl: () => get().checkoutUrl,

      syncCart: async () => {
        const { cartId, isSyncing, clearCart } = get();
        if (!cartId || isSyncing) return;

        set({ isSyncing: true });
        try {
          const data = await storefrontApiRequest(CART_QUERY, { id: cartId });
          if (!data) return;
          const cart = data?.data?.cart;
          if (!cart || cart.totalQuantity === 0) clearCart();
        } catch (error) {
          console.error('Failed to sync cart with Shopify:', error);
        } finally {
          set({ isSyncing: false });
        }
      }
    }),
    {
      name: 'nina-armend-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, cartId: state.cartId, checkoutUrl: state.checkoutUrl }),
    }
  )
);

// Re-export types
export type { CartItem, ShopifyProduct };


import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getSupabase } from '@/lib/supabaseClient';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';

interface WishlistItem {
  id: string;
  title: string;
  handle: string;
  image: string;
  price: string;
}

interface WishlistStore {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  toggleItem: (item: WishlistItem) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));

        const userId = useCloudAuthStore.getState().user?.id;
        if (userId) {
          getSupabase()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .from('wishlists' as any)
            .delete()
            .eq('user_id', userId)
            .eq('product_id', id)
            .then(({ error }) => {
              if (error) console.error('Error removing from wishlist:', error);
            });
        }
      },
      isInWishlist: (id) => get().items.some((i) => i.id === id),
      toggleItem: (item) => {
        if (get().isInWishlist(item.id)) {
          get().removeItem(item.id);
        } else {
          get().addItem(item);
        }
      },
    }),
    {
      name: 'nina-armend-wishlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

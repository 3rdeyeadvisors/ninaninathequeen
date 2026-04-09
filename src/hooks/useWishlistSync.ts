import { useEffect } from 'react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';
import { getSupabase } from '@/lib/supabaseClient';
import { toHandle } from './useProducts';

/**
 * Hook to sync local wishlist with Supabase when user logs in.
 */
export function useWishlistSync() {
  const { items: wishlistItems, addItem: addToWishlist } = useWishlistStore();
  const { user, isAuthenticated, isInitialized } = useCloudAuthStore();

  useEffect(() => {
    const syncWishlist = async () => {
      if (!isInitialized || !isAuthenticated || !user?.id) return;

      const supabase = getSupabase();

      try {
        // 1. Fetch remote wishlist
        const { data: remoteWishlist, error: fetchError } = await supabase
          .from('wishlists')
          .select('product_id');

        if (fetchError) {
          console.error('[WishlistSync] Failed to fetch remote wishlist:', fetchError);
          return;
        }

        const remoteProductIds = new Set((remoteWishlist || []).map((w: { product_id: string }) => w.product_id));

        // 2. Upload local items not in remote
        const itemsToUpload = wishlistItems.filter(item => !remoteProductIds.has(item.id));

        if (itemsToUpload.length > 0) {
          const { error: uploadError } = await supabase
            .from('wishlists')
            .upsert(
              itemsToUpload.map(item => ({
                user_id: user.id,
                product_id: item.id
              })),
              { onConflict: 'user_id,product_id' }
            );

          if (uploadError) {
            console.error('[WishlistSync] Failed to upload local items:', uploadError);
          }
        }

        // 3. Download remote items not in local
        // Note: This requires more product data than just the ID.
        // For simplicity, we'll fetch full product details for remote-only IDs.
        const remoteOnlyIds = (remoteWishlist || [])
          .map((w: { product_id: string }) => w.product_id)
          .filter((id: string) => !wishlistItems.some(item => item.id === id));

        if (remoteOnlyIds.length > 0) {
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, title, image, images, price')
            .in('id', remoteOnlyIds);

          if (!productsError && products) {
            products.forEach(p => {
              addToWishlist({
                id: p.id,
                title: p.title,
                handle: toHandle(p.title),
                image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || ''),
                price: p.price
              });
            });
          }
        }
      } catch (err) {
        console.error('[WishlistSync] Unexpected error:', err);
      }
    };

    syncWishlist();
  }, [isAuthenticated, isInitialized, user?.id, addToWishlist, wishlistItems]);
}

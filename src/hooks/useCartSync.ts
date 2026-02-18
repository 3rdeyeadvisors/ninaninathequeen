import { useEffect } from 'react';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';
import { getSupabase } from '@/lib/supabaseClient';

/**
 * Hook to sync local wishlist with Supabase when user logs in.
 */
export function useCartSync() {
  const { items: wishlistItems, addItem: addToWishlist } = useWishlistStore();
  const { user, isAuthenticated, isInitialized } = useCloudAuthStore();

  useEffect(() => {
    const syncWishlist = async () => {
      if (!isInitialized || !isAuthenticated || !user?.id) return;

      const supabase = getSupabase();

      try {
        // 1. Fetch remote wishlist
        const { data: remoteWishlist, error: fetchError } = await supabase
          .from('wishlists' as any)
          .select('product_id');

        if (fetchError) {
          console.error('[WishlistSync] Failed to fetch remote wishlist:', fetchError);
          return;
        }

        const remoteProductIds = new Set((remoteWishlist || []).map((w: any) => w.product_id));

        // 2. Upload local items not in remote
        const itemsToUpload = wishlistItems.filter(item => !remoteProductIds.has(item.id));

        if (itemsToUpload.length > 0) {
          console.log(`[WishlistSync] Syncing ${itemsToUpload.length} local items to database...`);
          const { error: uploadError } = await supabase
            .from('wishlists' as any)
            .upsert(
              itemsToUpload.map(item => ({
                user_id: user.id,
                product_id: item.id
              })),
              { onConflict: 'user_id, product_id' }
            );

          if (uploadError) {
            console.error('[WishlistSync] Failed to upload local items:', uploadError);
          }
        }

        // 3. Download remote items not in local
        // Note: This requires more product data than just the ID.
        // For simplicity, we'll fetch full product details for remote-only IDs.
        const remoteOnlyIds = (remoteWishlist || [])
          .map((w: any) => w.product_id)
          .filter((id: string) => !wishlistItems.some(item => item.id === id));

        if (remoteOnlyIds.length > 0) {
          console.log(`[WishlistSync] Fetching ${remoteOnlyIds.length} remote items for local wishlist...`);
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, title, handle, images, price')
            .in('id', remoteOnlyIds);

          if (!productsError && products) {
            products.forEach(p => {
              addToWishlist({
                id: p.id,
                title: p.title,
                handle: p.handle,
                image: (p.images as any)?.[0]?.url || '',
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
  }, [isAuthenticated, isInitialized, user?.id, addToWishlist]);
}

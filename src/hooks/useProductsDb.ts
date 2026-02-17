import { useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type ProductOverride } from '@/stores/adminStore';

export type SyncResult = { success: true } | { success: false; reason: 'auth' | 'forbidden' | 'error' };

/**
 * Hook to sync products with the database and Square.
 * Products are automatically synced to Square whenever they are added/edited/deleted.
 * 
 * SECURITY: Authentication is now handled server-side via JWT validation in edge functions.
 * The client only needs to pass the authorization header which is automatically included
 * by the Supabase client when the user is logged in.
 */
export function useProductsDb() {
  const { updateProductOverride, setProductOverrides } = useAdminStore();

  // Fetch all products from database on mount
  const fetchProducts = useCallback(async () => {
    try {
      const supabase = getSupabase();
      // Fetch all products to sync soft-deleted status locally
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      if (data) {
        // Update local store with database products in bulk
        const overrides: Record<string, ProductOverride> = {};
        data.forEach((product) => {
          overrides[product.id] = {
            id: product.id,
            title: product.title,
            price: product.price,
            inventory: product.inventory,
            sizeInventory: (product.size_inventory as Record<string, number>) || {},
            image: product.image || '',
            description: product.description || '',
            productType: product.product_type || 'Bikini',
            collection: product.collection || '',
            category: product.category || 'Other',
            status: product.status as 'Active' | 'Inactive' | 'Draft',
            itemNumber: product.item_number || '',
            colorCodes: product.color_codes || [],
            sizes: product.sizes || [],
            isDeleted: product.is_deleted || false,
            unitCost: (product as any).unit_cost || '0.00',
            images: (product as any).images || [],
          };
        });
        setProductOverrides(overrides);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, [setProductOverrides]);

  // Internal helper for syncing via edge function (includes auto-push to Square)
  // SECURITY: No longer passes adminEmail - server validates JWT instead
  // Returns { success, reason } — caller handles all toast messages
  const syncWithEdgeFunction = async (products: ProductOverride | ProductOverride[]): Promise<SyncResult> => {
    try {
      const supabase = getSupabase();

      // Get session directly — the Supabase SDK is the source of truth
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        console.error('Authentication required to sync products');
        return { success: false, reason: 'auth' };
      }

      // The edge function now validates admin role server-side via JWT
      // The authorization header is automatically included by Supabase client
      const { data, error } = await supabase.functions.invoke('sync-products', {
        body: { products },
      });

      if (data?.success && data.products) {
        // Update local store with the actual data from database
        const returnedProducts = (Array.isArray(data.products) ? data.products : [data.products]) as Record<string, unknown>[];
        returnedProducts.forEach((product) => {
          updateProductOverride(product.id as string, {
            id: product.id as string,
            title: product.title as string,
            price: product.price as string,
            inventory: product.inventory as number,
            sizeInventory: (product.size_inventory as Record<string, number>) || {},
            image: (product.image as string) || '',
            description: (product.description as string) || '',
            productType: (product.product_type as string) || 'Bikini',
            collection: (product.collection as string) || '',
            category: (product.category as string) || 'Other',
            status: product.status as 'Active' | 'Inactive' | 'Draft',
            itemNumber: (product.item_number as string) || '',
            colorCodes: (product.color_codes as string[]) || [],
            sizes: (product.sizes as string[]) || [],
            isDeleted: (product.is_deleted as boolean) || false,
            unitCost: (product.unit_cost as string) || '0.00',
            images: (product.images as string[]) || [],
          });
        });
      }

      if (error) {
        console.error('[useProductsDb] Database sync failed:', error);
        if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
          return { success: false, reason: 'forbidden' };
        } else if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
          return { success: false, reason: 'auth' };
        }
        return { success: false, reason: 'error' };
      }

      // NOTE: Square sync is now handled background-style by the 'sync-products' edge function itself
      // to reduce client-side latency and prevent redundant calls.
      return { success: true };
    } catch (err) {
      console.error('Database sync exception:', err);
      if (err instanceof Error) {
        console.error('Exception message:', err.message);
        console.error('Exception stack:', err.stack);
      }
      return { success: false, reason: 'error' };
    }
  };

  // Upsert a product to the database (auto-syncs to Square)
  const upsertProduct = useCallback(async (product: ProductOverride): Promise<SyncResult> => {
    return await syncWithEdgeFunction(product);
  }, []);

  // Bulk upsert products to the database (auto-syncs to Square)
  const bulkUpsertProducts = useCallback(async (products: ProductOverride[]): Promise<SyncResult> => {
    return await syncWithEdgeFunction(products);
  }, []);

  // Soft delete a product in the database (auto-syncs to Square)
  const deleteProductDb = useCallback(async (productId: string) => {
    // Preserve existing data by merging with isDeleted: true
    const existingOverride = useAdminStore.getState().productOverrides[productId];
    const productData = existingOverride
      ? { ...existingOverride, isDeleted: true }
      : { id: productId, isDeleted: true };

    return await syncWithEdgeFunction(productData as ProductOverride);
  }, []);

  // Bulk delete products - batches all deletions into a single API call
  const bulkDeleteProducts = useCallback(async (productIds: string[]): Promise<SyncResult> => {
    if (productIds.length === 0) return { success: true };
    
    const productsToDelete = productIds.map(id => {
      const existingOverride = useAdminStore.getState().productOverrides[id];
      return existingOverride
        ? { ...existingOverride, isDeleted: true }
        : { id, isDeleted: true };
    });
    
    return await syncWithEdgeFunction(productsToDelete as ProductOverride[]);
  }, []);

  // Load products from database on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    fetchProducts,
    upsertProduct,
    bulkUpsertProducts,
    deleteProductDb,
    bulkDeleteProducts,
  };
}

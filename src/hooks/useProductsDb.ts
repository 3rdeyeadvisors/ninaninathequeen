import { useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type ProductOverride } from '@/stores/adminStore';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';
import { toast } from 'sonner';

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
  const syncWithEdgeFunction = async (products: ProductOverride | ProductOverride[]) => {
    try {
      // Check if user is authenticated via Cloud Auth
      const cloudUser = useCloudAuthStore.getState().user;
      const isAuthenticated = useCloudAuthStore.getState().isAuthenticated;

      if (!isAuthenticated || !cloudUser) {
        console.error('Authentication required to sync products');
        toast.error('Please log in to save products to database.');
        return false;
      }

      const supabase = getSupabase();
      
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
          });
        });
      }

      if (error) {
        console.error('[useProductsDb] Database sync failed:', error);
        // Handle specific error cases
        if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
          toast.error('Admin access required to modify products.');
        } else if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
          toast.error('Please log in again to save products.');
        } else {
          try {
            const functionsError = error as { response?: { json: () => Promise<{ error?: string }> } };
            const errorBody = await functionsError.response?.json();
            console.error('[useProductsDb] Sync error body:', errorBody);
            toast.error(`Database sync failed: ${errorBody?.error || error.message || 'Unknown error'}`);
          } catch (e) {
            console.error('[useProductsDb] Could not parse error body:', error);
            toast.error(`Database sync failed: ${error.message || 'Unknown error'}`);
          }
        }
        return false;
      }

      // NOTE: Square sync is now handled background-style by the 'sync-products' edge function itself
      // to reduce client-side latency and prevent redundant calls.
      return true;
    } catch (err) {
      console.error('Database sync exception:', err);
      if (err instanceof Error) {
        console.error('Exception message:', err.message);
        console.error('Exception stack:', err.stack);
      }
      return false;
    }
  };

  // Upsert a product to the database (auto-syncs to Square)
  const upsertProduct = useCallback(async (product: ProductOverride) => {
    return await syncWithEdgeFunction(product);
  }, []);

  // Bulk upsert products to the database (auto-syncs to Square)
  const bulkUpsertProducts = useCallback(async (products: ProductOverride[]) => {
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
  const bulkDeleteProducts = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) return true;
    
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

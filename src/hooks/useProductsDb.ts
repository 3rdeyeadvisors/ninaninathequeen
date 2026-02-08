import { useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type ProductOverride } from '@/stores/adminStore';
import { useAuthStore, ADMIN_EMAIL } from '@/stores/authStore';
import { toast } from 'sonner';

/**
 * Hook to sync products with the database and Square.
 * Products are automatically synced to Square whenever they are added/edited/deleted.
 */
export function useProductsDb() {
  const { updateProductOverride } = useAdminStore();

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
        // Update local store with database products
        data.forEach((product) => {
          updateProductOverride(product.id, {
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
          });
        });
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, [updateProductOverride]);

  // Internal helper for syncing via edge function (includes auto-push to Square)
  const syncWithEdgeFunction = async (products: ProductOverride | ProductOverride[]) => {
    try {
      const userEmail = useAuthStore.getState().user?.email;

      if (!userEmail || userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        console.error('Admin access required to sync products');
        return false;
      }

      const supabase = getSupabase();
      const { data, error } = await supabase.functions.invoke('sync-products', {
        body: {
          products,
          adminEmail: userEmail,
        },
      });

      if (error) {
        console.error('Database sync failed:', error);
        return false;
      }

      // Auto-sync to Square after successful database sync
      try {
        await supabase.functions.invoke('square-sync-inventory', {
          body: { action: 'push' }
        });
        console.log('[useProductsDb] Auto-synced to Square');
      } catch (squareErr) {
        console.warn('[useProductsDb] Square auto-sync failed (non-blocking):', squareErr);
      }

      return true;
    } catch (err) {
      console.error('Database sync exception:', err);
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

  // Load products from database on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    fetchProducts,
    upsertProduct,
    bulkUpsertProducts,
    deleteProductDb,
  };
}

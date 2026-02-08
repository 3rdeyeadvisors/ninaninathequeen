import { useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type ProductOverride } from '@/stores/adminStore';
import { useAuthStore, ADMIN_EMAIL } from '@/stores/authStore';
import { useSquareSync } from './useSquareSync';
import { toast } from 'sonner';

/**
 * Hook to sync products with the database.
 * Fetches products on mount and provides functions to upsert/delete.
 */
export function useProductsDb() {
  const { updateProductOverride, settings } = useAdminStore();
  const { pushToSquare } = useSquareSync();

  // Fetch all products from database on mount
  const fetchProducts = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_deleted', false);

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

  // Internal helper for syncing via edge function
  const syncWithEdgeFunction = async (products: ProductOverride | ProductOverride[]) => {
    try {
      const userEmail = useAuthStore.getState().user?.email;

      if (!userEmail || userEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        console.error('Admin access required to sync products');
        return false;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/sync-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products,
          adminEmail: userEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Database sync failed:', result.error || 'Unknown error');
        return false;
      }
      return true;
    } catch (err) {
      console.error('Database sync exception:', err);
      return false;
    }
  };

  // Upsert a product to the database
  const upsertProduct = useCallback(async (product: ProductOverride) => {
    const success = await syncWithEdgeFunction(product);
    if (success && settings.autoSync && settings.posProvider === 'square') {
      // Small delay to ensure DB is updated before Square pulls from it
      setTimeout(() => pushToSquare(), 1000);
    }
    return success;
  }, [settings.autoSync, settings.posProvider, pushToSquare]);

  // Bulk upsert products to the database
  const bulkUpsertProducts = useCallback(async (products: ProductOverride[]) => {
    const success = await syncWithEdgeFunction(products);
    if (success && settings.autoSync && settings.posProvider === 'square') {
      setTimeout(() => pushToSquare(), 1000);
    }
    return success;
  }, [settings.autoSync, settings.posProvider, pushToSquare]);

  // Soft delete a product in the database
  const deleteProductDb = useCallback(async (productId: string) => {
    const success = await syncWithEdgeFunction({ id: productId, isDeleted: true } as any);
    if (success && settings.autoSync && settings.posProvider === 'square') {
      setTimeout(() => pushToSquare(), 1000);
    }
    return success;
  }, [settings.autoSync, settings.posProvider, pushToSquare]);

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

import { useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type ProductOverride } from '@/stores/adminStore';

/**
 * Hook to sync products with the database.
 * Fetches products on mount and provides functions to upsert/delete.
 */
export function useProductsDb() {
  const { productOverrides, updateProductOverride, deleteProduct } = useAdminStore();

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

  // Upsert a product to the database
  const upsertProduct = useCallback(async (product: ProductOverride) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('products')
        .upsert({
          id: product.id,
          title: product.title,
          price: product.price,
          inventory: product.inventory,
          size_inventory: product.sizeInventory || {},
          image: product.image,
          description: product.description,
          product_type: product.productType,
          collection: product.collection,
          category: product.category,
          status: product.status,
          item_number: product.itemNumber,
          color_codes: product.colorCodes,
          sizes: product.sizes,
          is_deleted: product.isDeleted || false,
        }, { onConflict: 'id' });

      if (error) {
        console.error('Error upserting product:', error);
        // Don't throw - allow localStorage fallback
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to upsert product:', err);
      return false;
    }
  }, []);

  // Bulk upsert products to the database
  const bulkUpsertProducts = useCallback(async (products: ProductOverride[]) => {
    try {
      const supabase = getSupabase();
      const rows = products.map(product => ({
        id: product.id,
        title: product.title,
        price: product.price,
        inventory: product.inventory,
        size_inventory: product.sizeInventory || {},
        image: product.image,
        description: product.description,
        product_type: product.productType,
        collection: product.collection,
        category: product.category,
        status: product.status,
        item_number: product.itemNumber,
        color_codes: product.colorCodes,
        sizes: product.sizes,
        is_deleted: product.isDeleted || false,
      }));

      const { error } = await supabase
        .from('products')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        console.error('Error bulk upserting products:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to bulk upsert products:', err);
      return false;
    }
  }, []);

  // Soft delete a product in the database
  const deleteProductDb = useCallback(async (productId: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('products')
        .update({ is_deleted: true })
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to delete product:', err);
      return false;
    }
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

import { useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type AdminOrder, type ShippingAddress } from '@/stores/adminStore';

/**
 * Hook to sync orders with the database.
 * Fetches orders on mount and provides functions to upsert.
 */
export function useOrdersDb() {
  const { setOrders, updateOrder } = useAdminStore();

  // Fetch all orders from database on mount
  const fetchOrders = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      if (data) {
        const formattedOrders: AdminOrder[] = data.map((order) => ({
          id: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          date: order.date,
          total: order.total,
          shippingCost: order.shipping_cost || undefined,
          itemCost: order.item_cost || undefined,
          status: order.status as AdminOrder['status'],
          trackingNumber: order.tracking_number || '',
          shippingAddress: (order.shipping_address as ShippingAddress) || undefined,
          items: (order.items as AdminOrder['items']) || [],
        }));
        
        setOrders(formattedOrders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, [setOrders]);

  // Upsert an order to the database
  const upsertOrder = useCallback(async (order: AdminOrder) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('orders')
        .upsert({
          id: order.id,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          date: order.date,
          total: order.total,
          shipping_cost: order.shippingCost,
          item_cost: order.itemCost,
          status: order.status,
          tracking_number: order.trackingNumber,
          items: order.items,
        }, { onConflict: 'id' })
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Error upserting order:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to upsert order:', err);
      return false;
    }
  }, []);

  // Update an order in the database
  const updateOrderDb = useCallback(async (orderId: string, updates: Partial<AdminOrder>) => {
    try {
      const supabase = getSupabase();

      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.trackingNumber !== undefined) dbUpdates.tracking_number = updates.trackingNumber;
      if (updates.shippingCost !== undefined) dbUpdates.shipping_cost = updates.shippingCost;
      if (updates.itemCost !== undefined) dbUpdates.item_cost = updates.itemCost;

      const { error } = await supabase
        .from('orders')
        .update(dbUpdates)
        .eq('id', orderId)
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Error updating order in DB:', error);
        return false;
      }

      // Update local store
      updateOrder(orderId, updates);
      return true;
    } catch (err) {
      console.error('Failed to update order:', err);
      return false;
    }
  }, [updateOrder]);

  // Load orders from database on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Create a manual order and decrement inventory
  const createManualOrder = useCallback(async (order: AdminOrder) => {
    try {
      const supabase = getSupabase();

      // 1. Insert order into database
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: order.id,
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          date: order.date,
          total: order.total,
          shipping_cost: order.shippingCost,
          item_cost: order.itemCost,
          status: order.status,
          tracking_number: order.trackingNumber,
          items: order.items as any,
        })
        .select('id')
        .maybeSingle();

      if (orderError) {
        console.error('Error creating manual order:', orderError);
        return false;
      }

      // 2. Decrement inventory for each item
      for (const item of order.items) {
        // Find product by title match in the store
        const overrides = useAdminStore.getState().productOverrides;
        const productEntry = Object.entries(overrides).find(([_, p]) => p.title === item.title);
        if (!productEntry) continue;

        const [productId, product] = productEntry;
        const sizeInventory = { ...(product.sizeInventory || {}) };
        const size = item.size || '';
        if (size && sizeInventory[size] !== undefined) {
          sizeInventory[size] = Math.max(0, (sizeInventory[size] || 0) - item.quantity);
        }
        const newTotal = Object.values(sizeInventory).reduce((acc, val) => acc + (val || 0), 0);

        // Update product in database
        await supabase
          .from('products')
          .update({
            inventory: newTotal,
            size_inventory: sizeInventory as any,
          })
          .eq('id', productId)
          .select('id')
          .maybeSingle();

        // Update local store
        useAdminStore.getState().updateProductOverride(productId, {
          sizeInventory,
          inventory: newTotal,
        });
      }

      // 3. Add to local store
      useAdminStore.getState().addOrder(order);
      return true;
    } catch (err) {
      console.error('Failed to create manual order:', err);
      return false;
    }
  }, []);

  return {
    fetchOrders,
    upsertOrder,
    updateOrderDb,
    createManualOrder
  };
}

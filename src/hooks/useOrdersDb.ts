import { useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type AdminOrder } from '@/stores/adminStore';

/**
 * Hook to sync orders with the database.
 * Fetches orders on mount and provides functions to upsert.
 */
export function useOrdersDb() {
  const { orders, addOrder, updateOrder } = useAdminStore();

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

      if (data && data.length > 0) {
        // Clear existing orders and load from DB
        const store = useAdminStore.getState();
        
        // Only replace if we have DB data
        data.forEach((order) => {
          const existingOrder = store.orders.find(o => o.id === order.id);
          if (!existingOrder) {
            addOrder({
              id: order.id,
              customerName: order.customer_name,
              customerEmail: order.customer_email,
              date: order.date,
              total: order.total,
              shippingCost: order.shipping_cost || undefined,
              itemCost: order.item_cost || undefined,
              status: order.status as AdminOrder['status'],
              trackingNumber: order.tracking_number || '',
              items: (order.items as AdminOrder['items']) || [],
            });
          }
        });
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  }, [addOrder]);

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
        }, { onConflict: 'id' });

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

  // Load orders from database on mount
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    fetchOrders,
    upsertOrder,
  };
}

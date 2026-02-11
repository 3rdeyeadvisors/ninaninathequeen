import { useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabaseClient';
import { useAdminStore, type AdminCustomer } from '@/stores/adminStore';

/**
 * Hook to sync customers with the database.
 * Fetches customers on mount and provides functions to upsert/delete.
 */
export function useCustomersDb() {
  const { setCustomers, deleteCustomer } = useAdminStore();

  // Fetch all customers from database on mount
  const fetchCustomers = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
        return;
      }

      if (data) {
        const formattedCustomers: AdminCustomer[] = data.map((customer) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          totalSpent: customer.total_spent || '0.00',
          orderCount: customer.order_count || 0,
          joinDate: customer.join_date,
        }));
        
        setCustomers(formattedCustomers);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  }, [setCustomers]);

  // Upsert a customer to the database
  const upsertCustomer = useCallback(async (customer: AdminCustomer) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('customers')
        .upsert({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          total_spent: customer.totalSpent,
          order_count: customer.orderCount,
          join_date: customer.joinDate,
        }, { onConflict: 'id' })
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Error upserting customer:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to upsert customer:', err);
      return false;
    }
  }, []);

  // Delete a customer from the database
  const deleteCustomerDb = useCallback(async (customerId: string) => {
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)
        .select('id')
        .maybeSingle();

      if (error) {
        console.error('Error deleting customer:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Failed to delete customer:', err);
      return false;
    }
  }, []);

  // Load customers from database on mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    fetchCustomers,
    upsertCustomer,
    deleteCustomerDb,
  };
}

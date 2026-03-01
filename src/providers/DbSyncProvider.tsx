import { useEffect, useState, useRef, createContext, useContext, ReactNode, useCallback } from 'react';
import { useAdminStore, type ProductOverride, type AdminOrder, type AdminCustomer, type ShippingAddress } from '@/stores/adminStore';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';
import { toast } from 'sonner';
import { getSupabase } from '@/lib/supabaseClient';

interface DbSyncContextType {
  isLoading: boolean;
  isInitialized: boolean;
  syncProducts: () => Promise<void>;
  syncOrders: () => Promise<void>;
  syncCustomers: () => Promise<void>;
  syncSettings: () => Promise<void>;
}

const DbSyncContext = createContext<DbSyncContextType | null>(null);

export function useDbSync() {
  const context = useContext(DbSyncContext);
  if (!context) {
    throw new Error('useDbSync must be used within a DbSyncProvider');
  }
  return context;
}

interface DbSyncProviderProps {
  children: ReactNode;
}

export function DbSyncProvider({ children }: DbSyncProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const isInitializedRef = useRef(false);
  const { isAuthenticated } = useCloudAuthStore();
  const { updateProductOverride, setOrders, setCustomers, updateSettings } = useAdminStore();

  // ------------------------------------------------------------------
  // Sync helpers (stable references via useCallback)
  // ------------------------------------------------------------------

  const syncProducts = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.from('products').select('*');
      if (error) { console.error('Error fetching products:', error); return; }
      if (data && data.length > 0) {
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
            status: (product.status as 'Active' | 'Inactive' | 'Draft') || 'Active',
            itemNumber: product.item_number || '',
            colorCodes: product.color_codes || [],
            sizes: product.sizes || [],
            isDeleted: product.is_deleted || false,
            unitCost: (product as any).unit_cost || '0.00',
            images: (product as any).images || [],
          });
        });
      }
    } catch (err) { console.error('Failed to fetch products:', err); }
  }, [updateProductOverride]);

  const syncOrders = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('orders').select('*').order('created_at', { ascending: false });
      if (error) { console.error('Error fetching orders:', error); return; }
      if (data) {
        const formattedOrders: AdminOrder[] = data.map((order) => ({
          id: order.id,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          date: order.date,
          total: order.total,
          shippingCost: order.shipping_cost || undefined,
          itemCost: order.item_cost || undefined,
          transactionFee: (order as any).transaction_fee || undefined,
          status: order.status as AdminOrder['status'],
          trackingNumber: order.tracking_number || '',
          shippingAddress: (order.shipping_address as ShippingAddress) || undefined,
          items: (order.items as AdminOrder['items']) || [],
        }));
        setOrders(formattedOrders);
      }
    } catch (err) { console.error('Failed to fetch orders:', err); }
  }, [setOrders]);

  const syncCustomers = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('customers').select('*').order('created_at', { ascending: false });
      if (error) { console.error('Error fetching customers:', error); return; }
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
    } catch (err) { console.error('Failed to fetch customers:', err); }
  }, [setCustomers]);

  const syncSettings = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const applySettings = (data: Record<string, unknown>) => {
        updateSettings({
          storeName: (data.store_name as string) || 'NINA ARMEND',
          currency: (data.currency as string) || 'USD',
          shippingRate: Number(data.shipping_rate) || 8.50,
          lowStockThreshold: (data.low_stock_threshold as number) || 10,
          posProvider: (data.pos_provider as 'none' | 'square') || 'none',
          seoTitle: (data.seo_title as string) || '',
          seoDescription: (data.seo_description as string) || '',
          instagramUrl: (data.instagram_url as string) || '',
          facebookUrl: (data.facebook_url as string) || '',
          tiktokUrl: (data.tiktok_url as string) || '',
          contactEmail: (data.contact_email as string) || '',
          contactPhone: (data.contact_phone as string) || '',
          isMaintenanceMode: (data.is_maintenance_mode as boolean) ?? false,
          birthdayEmailsSentMonth: data.birthday_emails_sent_month as number | undefined,
          birthdayEmailsSentYear: data.birthday_emails_sent_year as number | undefined,
          birthdayEmailsSentCount: data.birthday_emails_sent_count as number | undefined,
        });
      };
      const { data: settings, error: settingsError } = await supabase
        .from('store_settings').select('*').limit(1).maybeSingle();
      if (!settingsError && settings) { applySettings(settings); return; }
      const { data: publicSettings, error: publicError } = await supabase
        .from('public_store_settings' as any).select('*').limit(1).maybeSingle();
      if (!publicError && publicSettings) {
        applySettings(publicSettings as unknown as Record<string, unknown>);
        return;
      }
      console.warn('Could not fetch store settings. Primary error:', settingsError?.message, '| Fallback error:', publicError?.message);
    } catch (err) { console.error('Failed to fetch settings:', err); }
  }, [updateSettings]);

  // ------------------------------------------------------------------
  // Initial full load
  // ------------------------------------------------------------------

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([syncProducts(), syncOrders(), syncCustomers(), syncSettings()]);
      setIsInitialized(true);
      isInitializedRef.current = true;
    } catch (err) {
      console.error('Error loading data from database:', err);
      toast.error('Failed to load data from database. Using local cache.');
    } finally {
      setIsLoading(false);
    }
  }, [syncProducts, syncOrders, syncCustomers, syncSettings]);

  // Boot: run on mount AND whenever auth state changes.
  // This is critical because orders/customers/settings are behind admin-only
  // RLS policies — the initial load (before login) returns empty. We must
  // re-run loadAllData() once the user is authenticated so the dashboard
  // populates without requiring a manual page refresh.
  useEffect(() => {
    // Reset initialized flag so loadAllData() runs fresh on auth change
    isInitializedRef.current = false;
    setIsInitialized(false);

    const store = useAdminStore.getState();
    if (store._hasHydrated) {
      loadAllData();
    } else {
      const unsubscribe = useAdminStore.subscribe((state) => {
        if (state._hasHydrated && !isInitializedRef.current) {
          loadAllData();
          unsubscribe();
        }
      });
      return () => unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ------------------------------------------------------------------
  // Supabase Realtime — push DB changes to the UI instantly without
  // requiring a page refresh.
  // ------------------------------------------------------------------
  useEffect(() => {
    const supabase = getSupabase();

    const applyProductRow = (product: Record<string, unknown>) => {
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
        status: (product.status as 'Active' | 'Inactive' | 'Draft') || 'Active',
        itemNumber: (product.item_number as string) || '',
        colorCodes: (product.color_codes as string[]) || [],
        sizes: (product.sizes as string[]) || [],
        isDeleted: (product.is_deleted as boolean) || false,
        unitCost: (product.unit_cost as string) || '0.00',
        images: (product.images as string[]) || [],
      });
    };

    const productsChannel = supabase
      .channel('realtime-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          updateProductOverride((payload.old as Record<string, unknown>).id as string, { isDeleted: true });
        } else {
          applyProductRow(payload.new as Record<string, unknown>);
        }
      })
      .subscribe();

    // For orders & customers, do a full re-fetch so sort order is always correct
    const ordersChannel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        syncOrders();
      })
      .subscribe();

    const customersChannel = supabase
      .channel('realtime-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        syncCustomers();
      })
      .subscribe();

    const settingsChannel = supabase
      .channel('realtime-settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, () => {
        syncSettings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [updateProductOverride, syncOrders, syncCustomers, syncSettings]);

  // ------------------------------------------------------------------
  // Visibility-change refetch — silently re-sync when the user returns
  // to this tab after it's been hidden (e.g. switching tabs or windows).
  // ------------------------------------------------------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isInitializedRef.current) {
        Promise.all([syncProducts(), syncOrders(), syncCustomers(), syncSettings()]).catch((err) => {
          console.warn('Visibility-change re-sync failed:', err);
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncProducts, syncOrders, syncCustomers, syncSettings]);

  return (
    <DbSyncContext.Provider value={{ isLoading, isInitialized, syncProducts, syncOrders, syncCustomers, syncSettings }}>
      {children}
    </DbSyncContext.Provider>
  );
}

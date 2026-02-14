import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useAdminStore, type ProductOverride, type AdminOrder, type AdminCustomer } from '@/stores/adminStore';
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
  const { updateProductOverride, setOrders, setCustomers, updateSettings } = useAdminStore();

  // Sync products from database
  const syncProducts = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('products')
        .select('*');

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

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
          });
        });
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // Sync orders from database - FULL REPLACEMENT
  const syncOrders = async () => {
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
          items: (order.items as AdminOrder['items']) || [],
        }));
        setOrders(formattedOrders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  // Sync customers from database - FULL REPLACEMENT
  const syncCustomers = async () => {
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
  };

  // Sync settings from database
  const syncSettings = async () => {
    try {
      const supabase = getSupabase();

      const applySettings = (data: Record<string, unknown>) => {
        updateSettings({
          storeName: (data.store_name as string) || 'NINA ARMEND',
          currency: (data.currency as string) || 'USD',
          shippingRate: Number(data.shipping_rate) || 8.50,
          lowStockThreshold: (data.low_stock_threshold as number) || 10,
          posProvider: (data.pos_provider as 'none' | 'square') || 'none',
          squareApiKey: (data.square_api_key as string) || '',
          squareApplicationId: (data.square_application_id as string) || '',
          squareLocationId: (data.square_location_id as string) || '',
          
          seoTitle: (data.seo_title as string) || '',
          seoDescription: (data.seo_description as string) || '',
          instagramUrl: (data.instagram_url as string) || '',
          facebookUrl: (data.facebook_url as string) || '',
          tiktokUrl: (data.tiktok_url as string) || '',
          contactEmail: (data.contact_email as string) || '',
          contactPhone: (data.contact_phone as string) || '',
          isMaintenanceMode: (data.is_maintenance_mode as boolean) ?? false,
        });
      };

      // Try admin-level access first (full table), fall back to public view
      const { data: settings, error: settingsError } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!settingsError && settings) {
        applySettings(settings);
        return;
      }

      // Fall back to public view (excludes sensitive Square API fields)
      const { data: publicSettings, error: publicError } = await supabase
        .from('public_store_settings' as any)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!publicError && publicSettings) {
        applySettings(publicSettings as unknown as Record<string, unknown>);
        return;
      }

      console.warn('Could not fetch store settings:', publicError?.message || settingsError?.message);

    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  // Initial load from database
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      
      try {
        await Promise.all([
          syncProducts(),
          syncOrders(),
          syncCustomers(),
          syncSettings(),
        ]);
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Error loading data from database:', err);
        toast.error('Failed to load data from database. Using local cache.');
      } finally {
        setIsLoading(false);
      }
    };

    const store = useAdminStore.getState();
    if (store._hasHydrated) {
      loadAllData();
    } else {
      const unsubscribe = useAdminStore.subscribe((state) => {
        if (state._hasHydrated && !isInitialized) {
          loadAllData();
          unsubscribe();
        }
      });
      return () => unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DbSyncContext.Provider value={{ 
      isLoading, 
      isInitialized, 
      syncProducts, 
      syncOrders, 
      syncCustomers, 
      syncSettings 
    }}>
      {children}
    </DbSyncContext.Provider>
  );
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ShippingAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  total: string;
  shippingCost?: string;
  itemCost?: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingNumber: string;
  shippingAddress?: ShippingAddress;
  items: Array<{
    title: string;
    quantity: number;
    price: string;
    image: string;
    size?: string;
  }>;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: string;
  orderCount: number;
  joinDate: string;
}

export interface ProductOverride {
  id: string;
  title: string;
  price: string;
  inventory: number;
  sizeInventory?: Record<string, number>;
  image: string;
  images?: string[];
  description: string;
  productType?: string;
  isDeleted?: boolean;
  sizes?: string[];
  collection?: string;
  category?: string;
  status?: 'Active' | 'Inactive' | 'Draft';
  itemNumber?: string;
  colorCodes?: string[];
  unitCost?: string;
}

export interface AdminSettings {
  storeName: string;
  currency: string;
  shippingRate: number;
  lowStockThreshold: number;
  posProvider: 'none' | 'square';
  
  // New settings
  seoTitle?: string;
  seoDescription?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  isMaintenanceMode?: boolean;
  birthdayEmailsSentMonth?: number;
  birthdayEmailsSentYear?: number;
  birthdayEmailsSentCount?: number;
}

interface AdminStore {
  orders: AdminOrder[];
  customers: AdminCustomer[];
  productOverrides: Record<string, ProductOverride>;
  settings: AdminSettings;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addOrder: (order: AdminOrder) => void;
  updateOrder: (orderId: string, updates: Partial<AdminOrder>) => void;
  updateProductOverride: (id: string, override: Partial<ProductOverride>) => void;
  decrementInventory: (productId: string, size: string, quantity: number) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: AdminCustomer) => void;
  setCustomers: (customers: AdminCustomer[]) => void;
  deleteCustomer: (id: string) => void;
  setOrders: (orders: AdminOrder[]) => void;
  setProductOverrides: (overrides: Record<string, ProductOverride>) => void;
  updateSettings: (settings: Partial<AdminSettings>) => void;
}

const INITIAL_SETTINGS: AdminSettings = {
  storeName: 'NINA ARMEND',
  currency: 'USD',
  shippingRate: 8.50,
  lowStockThreshold: 10,
  posProvider: 'square',
  
  seoTitle: 'Nina Armend | Luxury Brazilian Swimwear',
  seoDescription: 'Discover our exclusive collection of premium Brazilian swimwear, handcrafted with the finest Brazilian fabrics.',
  instagramUrl: 'https://instagram.com/ninaarmend',
  facebookUrl: '',
  tiktokUrl: '',
  contactEmail: 'hello@ninaarmend.com',
  contactPhone: '',
  isMaintenanceMode: false
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      orders: [],
      customers: [],
      productOverrides: {},
      settings: INITIAL_SETTINGS,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
      })),

      updateOrder: (orderId, updates) => set((state) => ({
        orders: state.orders.map(o =>
          o.id === orderId ? { ...o, ...updates } : o
        )
      })),

      updateProductOverride: (id: string, override) => set((state) => {
        const current = state.productOverrides[id] || {};
        const newOverride = { ...current, ...override, id } as ProductOverride;

        if (newOverride.sizeInventory) {
          newOverride.inventory = Object.values(newOverride.sizeInventory).reduce((acc, val) => acc + (val || 0), 0);
        }

        return {
          productOverrides: {
            ...state.productOverrides,
            [id]: newOverride
          }
        };
      }),

      decrementInventory: (productId, size, quantity) => set((state) => {
        const currentOverride = state.productOverrides[productId];
        if (!currentOverride) return state;

        const sizeInventory = { ...(currentOverride.sizeInventory || {}) };
        const currentSizeStock = sizeInventory[size] || 0;
        const newSizeStock = Math.max(0, currentSizeStock - quantity);

        sizeInventory[size] = newSizeStock;
        const newTotalInventory = Object.values(sizeInventory).reduce((acc, val) => acc + (val || 0), 0);

        const updatedOverride = {
          ...currentOverride,
          sizeInventory,
          inventory: newTotalInventory
        };

        return {
          productOverrides: {
            ...state.productOverrides,
            [productId]: updatedOverride
          }
        };
      }),

      deleteProduct: (id) => set((state) => ({
        productOverrides: {
          ...state.productOverrides,
          [id]: { ...state.productOverrides[id], isDeleted: true, id } as ProductOverride
        }
      })),

      addCustomer: (customer) => set((state) => ({
        customers: [customer, ...state.customers]
      })),

      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),

      setCustomers: (customers) => set({ customers }),

      setOrders: (orders) => set({ orders }),

      setProductOverrides: (productOverrides) => set({ productOverrides }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      }))
    }),
    {
      name: 'nina-armend-admin-v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

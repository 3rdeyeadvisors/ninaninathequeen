import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  description: string;
  productType?: string;
  isDeleted?: boolean;
  sizes?: string[];
  collection?: string;
  category?: string; // 'Top & Bottom' | 'One-Piece' | 'Other'
  status?: 'Active' | 'Inactive' | 'Draft';
  itemNumber?: string;     // SKU/Item number (e.g., "LB-001")
  colorCodes?: string[];   // Array of hex colors (e.g., ["#FFD700", "#1A1A1A"])
}

export interface AdminSettings {
  storeName: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
  posProvider: 'none' | 'square';
  squareApiKey: string;
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
  deleteCustomer: (id: string) => void;
  updateSettings: (settings: Partial<AdminSettings>) => void;
}

const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: '#ORD-7829',
    customerName: 'Alice Johnson',
    customerEmail: 'alice@example.com',
    date: '2025-05-15',
    total: '160.00',
    shippingCost: '12.50',
    itemCost: '45.00',
    status: 'Delivered',
    trackingNumber: 'NA-982341',
    items: [
      { title: 'Copacabana Triangle Top', quantity: 1, price: '85.00', image: 'https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=200', size: 'M' },
      { title: 'Copacabana Tie Bottom', quantity: 1, price: '75.00', image: 'https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=200', size: 'S' }
    ]
  },
  {
    id: '#ORD-7830',
    customerName: 'Bob Smith',
    customerEmail: 'bob@example.com',
    date: '2025-05-16',
    total: '85.00',
    shippingCost: '0.00',
    itemCost: '25.00',
    status: 'Processing',
    trackingNumber: 'Pending',
    items: [
      { title: 'Ipanema Bandeau Top', quantity: 1, price: '85.00', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=200', size: 'L' }
    ]
  }
];

const INITIAL_CUSTOMERS: AdminCustomer[] = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice@example.com', totalSpent: '1250.00', orderCount: 5, joinDate: '2024-12-01' },
  { id: 'c2', name: 'Bob Smith', email: 'bob@example.com', totalSpent: '450.00', orderCount: 2, joinDate: '2025-01-15' },
  { id: 'c3', name: 'Charlie Davis', email: 'charlie@example.com', totalSpent: '245.00', orderCount: 1, joinDate: '2025-03-10' },
  { id: 'c4', name: 'Diana Prince', email: 'diana@amazon.com', totalSpent: '890.00', orderCount: 3, joinDate: '2025-02-20' }
];

const INITIAL_SETTINGS: AdminSettings = {
  storeName: 'NINA ARMEND',
  currency: 'USD',
  taxRate: 7.5,
  lowStockThreshold: 10,
  posProvider: 'none',
  squareApiKey: ''
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      orders: INITIAL_ORDERS,
      customers: INITIAL_CUSTOMERS,
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

        // Ensure inventory (total) is synced with sizeInventory if it was updated
        if (override.sizeInventory) {
          newOverride.inventory = Object.values(override.sizeInventory).reduce((acc, val) => acc + val, 0);
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

        // If no override exists yet, we create one starting from a default base
        // In a real app, we'd fetch the product details first, but here we can
        // initialize it with defaults or use the provided data.
        const sizeInventory = currentOverride?.sizeInventory || {
          'XS': 15, 'S': 15, 'M': 15, 'L': 15, 'XL': 15, '2XL': 15
        };

        const currentSizeStock = sizeInventory[size] !== undefined
          ? sizeInventory[size]
          : (currentOverride ? 0 : 15);
        const newSizeStock = Math.max(0, currentSizeStock - quantity);

        const newSizeInventory = {
          ...sizeInventory,
          [size]: newSizeStock
        };

        const newTotalInventory = Object.values(newSizeInventory).reduce((acc, val) => acc + val, 0);

        const updatedOverride = {
          ...(currentOverride || {
            id: productId,
            title: 'Product', // Fallback, usually updated by other means
            price: '0.00',
            image: '',
            description: '',
          }),
          sizeInventory: newSizeInventory,
          inventory: newTotalInventory
        };

        return {
          productOverrides: {
            ...state.productOverrides,
            [productId]: updatedOverride as ProductOverride
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

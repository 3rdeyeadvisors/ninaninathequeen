import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  total: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingNumber: string;
  items: Array<{
    title: string;
    quantity: number;
    price: string;
    image: string;
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
  image: string;
  description: string;
  isDeleted?: boolean;
  date: string;
  total: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  tracking: string;
  items: Array<{
    title: string;
    price: string;
    quantity: number;
  }>;
  type: 'Online' | 'POS';
}

interface AdminSettings {
  storeName: string;
  currency: string;
  taxRate: number;
  lowStockThreshold: number;
}

interface AdminStore {
  orders: AdminOrder[];
  customers: AdminCustomer[];
  productOverrides: Record<string, ProductOverride>;
  addOrder: (order: AdminOrder) => void;
  updateOrderStatus: (orderId: string, status: AdminOrder['status'], trackingNumber?: string) => void;
  updateProductOverride: (id: string, override: Partial<ProductOverride>) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: AdminCustomer) => void;
}

const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: '#ORD-7829',
    customerName: 'Alice Johnson',
    customerEmail: 'alice@example.com',
    date: '2025-05-15',
    total: '160.00',
    status: 'Delivered',
    trackingNumber: 'NA-982341',
    items: [
      { title: 'Copacabana Triangle Top', quantity: 1, price: '85.00', image: 'https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=200' },
      { title: 'Copacabana Tie Bottom', quantity: 1, price: '75.00', image: 'https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=200' }
    ]
  },
  {
    id: '#ORD-7830',
    customerName: 'Bob Smith',
    customerEmail: 'bob@example.com',
    date: '2025-05-16',
    total: '85.00',
    status: 'Processing',
    trackingNumber: 'Pending',
    items: [
      { title: 'Ipanema Bandeau Top', quantity: 1, price: '85.00', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=200' }
    ]
  }
];

const INITIAL_CUSTOMERS: AdminCustomer[] = [
  { id: 'c1', name: 'Alice Johnson', email: 'alice@example.com', totalSpent: '1250.00', orderCount: 5, joinDate: '2024-12-01' },
  { id: 'c2', name: 'Bob Smith', email: 'bob@example.com', totalSpent: '450.00', orderCount: 2, joinDate: '2025-01-15' },
  { id: 'c3', name: 'Charlie Davis', email: 'charlie@example.com', totalSpent: '245.00', orderCount: 1, joinDate: '2025-03-10' },
  { id: 'c4', name: 'Diana Prince', email: 'diana@amazon.com', totalSpent: '890.00', orderCount: 3, joinDate: '2025-02-20' }
  settings: AdminSettings;
  addOrder: (order: Omit<AdminOrder, 'id' | 'date' | 'status' | 'tracking'>) => void;
  updateOrderStatus: (id: string, status: AdminOrder['status'], tracking?: string) => void;
  updateSettings: (settings: Partial<AdminSettings>) => void;
}

const DEFAULT_ORDERS: AdminOrder[] = [
  { id: '#ORD-7829', customerName: 'Alice Johnson', date: '2025-05-15', total: '$160.00', status: 'Delivered', tracking: 'NA-982341', items: [], type: 'Online' },
  { id: '#ORD-7830', customerName: 'Bob Smith', date: '2025-05-16', total: '$85.00', status: 'Processing', tracking: 'Pending', items: [], type: 'Online' },
  { id: '#ORD-7831', customerName: 'Charlie Davis', date: '2025-05-17', total: '$245.00', status: 'Shipped', tracking: 'NA-982345', items: [], type: 'Online' },
  { id: '#ORD-7832', customerName: 'Diana Prince', date: '2025-05-18', total: '$120.00', status: 'Pending', tracking: 'Pending', items: [], type: 'Online' },
];

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      orders: INITIAL_ORDERS,
      customers: INITIAL_CUSTOMERS,
      productOverrides: {},

      addOrder: (order) => set((state) => ({
        orders: [order, ...state.orders]
      })),

      updateOrderStatus: (orderId, status, trackingNumber) => set((state) => ({
        orders: state.orders.map(o =>
          o.id === orderId ? { ...o, status, trackingNumber: trackingNumber ?? o.trackingNumber } : o
        )
      })),

      updateProductOverride: (id, override) => set((state) => ({
        productOverrides: {
          ...state.productOverrides,
          [id]: { ...state.productOverrides[id], ...override, id } as ProductOverride
        }
      })),

      deleteProduct: (id) => set((state) => ({
        productOverrides: {
          ...state.productOverrides,
          [id]: { ...state.productOverrides[id], isDeleted: true, id } as ProductOverride
        }
      })),

      addCustomer: (customer) => set((state) => ({
        customers: [customer, ...state.customers]
      }))
    }),
    {
      name: 'nina-armend-admin-v1',
      orders: DEFAULT_ORDERS,
      settings: {
        storeName: 'NINA ARMEND',
        currency: 'USD',
        taxRate: 7.5,
        lowStockThreshold: 10,
      },

      addOrder: (orderData) => set((state) => {
        const newOrder: AdminOrder = {
          ...orderData,
          id: `#ORD-${Math.floor(10000 + Math.random() * 90000)}`,
          date: new Date().toISOString().split('T')[0],
          status: 'Pending',
          tracking: 'Pending',
        };
        return { orders: [newOrder, ...state.orders] };
      }),

      updateOrderStatus: (id, status, tracking) => set((state) => ({
        orders: state.orders.map(o =>
          o.id === id ? { ...o, status, tracking: tracking || o.tracking } : o
        )
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'nina-armend-admin-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

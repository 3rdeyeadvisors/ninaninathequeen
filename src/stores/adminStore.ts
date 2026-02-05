import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AdminOrder {
  id: string;
  customerName: string;
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

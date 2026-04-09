export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: string;
  size?: string;
  image?: string;
}

export interface ProductRow {
  id: string;
  title: string;
  price: string;
  inventory: number;
  size_inventory: Record<string, number> | null;
  image: string | null;
  images: string[] | null;
  description: string | null;
  product_type: string | null;
  collection: string | null;
  category: string | null;
  status: 'Active' | 'Inactive' | 'Draft' | null;
  item_number: string | null;
  color_codes: string[] | null;
  sizes: string[] | null;
  is_deleted: boolean | null;
  unit_cost: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface OrderRow {
  id: string;
  customer_name: string;
  customer_email: string;
  date: string;
  total: string;
  shipping_cost: string | null;
  item_cost: string | null;
  transaction_fee: string | null;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Pending' | 'Cancelled';
  tracking_number: string | null;
  shipping_address: ShippingAddress | null;
  items: OrderItem[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface NewsletterSubscriberRow {
  email: string;
  created_at?: string;
}

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  total_spent: string | null;
  order_count: number | null;
  join_date: string;
  created_at?: string;
}

export interface StoreSettingsRow {
  id: string;
  store_name: string | null;
  currency: string | null;
  shipping_rate: number | null;
  low_stock_threshold: number | null;
  pos_provider: 'none' | 'square' | null;
  seo_title: string | null;
  seo_description: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_maintenance_mode: boolean | null;
  birthday_emails_sent_month: number | null;
  birthday_emails_sent_year: number | null;
  birthday_emails_sent_count: number | null;
  created_at?: string;
  updated_at?: string;
}

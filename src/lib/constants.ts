export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL'] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

export interface ShippingOption {
  id: string;
  label: string;
  price: number;
  estimatedDelivery: string;
}

export const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: 'standard', label: 'Standard Domestic (US)', price: 8.50, estimatedDelivery: '5–7 business days' },
  { id: 'express', label: 'Express Domestic (US)', price: 15.00, estimatedDelivery: '2–3 business days' },
  { id: 'international', label: 'International', price: 22.00, estimatedDelivery: '7–14 business days' },
];

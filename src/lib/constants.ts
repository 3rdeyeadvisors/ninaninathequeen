export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

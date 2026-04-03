export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL'] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

// Flat discount applied to every matching Top + Bottom pair from the same collection.
export const MATCHING_SET_DISCOUNT = 10;

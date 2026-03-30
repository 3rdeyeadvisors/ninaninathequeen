export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL'] as const;
export type ProductSize = (typeof PRODUCT_SIZES)[number];

// Matching set prices — keyed by collection name (lowercase, trimmed).
// When a cart contains a matching top + bottom from the same collection,
// the set price applies instead of the sum of individual prices.
// Mixed sets (different collections) pay individual prices.
export const MATCHING_SET_PRICES: Record<string, number> = {
  'copacabana triangle white': 83,
  'copacabana triangle black': 83,
  'maravilhosa': 80,
  'magnifico black & white': 98,
  'magnifico black and white': 98,
  'o mar blue & white': 98,
  'o mar blue and white': 98,
  'bela black': 86,
  'bela beige': 86,
  'boa': 78,
  'tropical': 98,
  'bonita': 78,
  'brown & white floral': 98,
  'brown and white floral': 98,
  'black triangle blue beads': 78,
};

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MATCHING_SET_DISCOUNT } from './constants';
import type { CartItem } from '@/stores/cartStore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns the collection key for a product title by stripping
 * common suffixes ("top", "bottom", "bikini top", "bikini bottom").
 */
export function getCollectionKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*(bikini\s*)?(top|bottom)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates the total discount from matching set deals.
 *
 * Rules:
 * - A "matching set" = one Top + one Bottom whose titles share the same
 *   collection key.
 * - Each matched pair gets a flat $10 discount.
 * - Mixed sets (different collections) receive no discount.
 *
 * Returns: discount amount in dollars (0 if no matching sets).
 */
export function calculateSetDiscount(items: CartItem[]): number {
  // Flatten items into individual units for easier matching
  const flattenedItems: CartItem[] = [];
  items.forEach(item => {
    for (let i = 0; i < item.quantity; i++) {
      flattenedItems.push({ ...item, quantity: 1 });
    }
  });

  const tops = flattenedItems.filter(i => i.product.category === 'Top');
  const bottoms = flattenedItems.filter(i => i.product.category === 'Bottom');

  let totalDiscount = 0;
  const usedBottoms = new Set<number>();

  for (const top of tops) {
    const topKey = getCollectionKey(top.product.title);

    const matchIndex = bottoms.findIndex(
      (b, idx) => !usedBottoms.has(idx) && getCollectionKey(b.product.title) === topKey
    );

    if (matchIndex === -1) continue;

    usedBottoms.add(matchIndex);
    totalDiscount += MATCHING_SET_DISCOUNT;
  }

  return totalDiscount;
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CartItem } from "@/stores/cartStore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates the discount for matching sets in the cart.
 * A matching set is defined as one 'Top' and one 'Bottom' of the same product title.
 * Each matching set receives a $10 discount.
 */
export function calculateSetDiscount(items: CartItem[]): number {
  const tops: Record<string, number> = {};
  const bottoms: Record<string, number> = {};

  items.forEach(item => {
    const category = item.product.category;
    const title = item.product.title;
    if (category === 'Top') {
      tops[title] = (tops[title] || 0) + item.quantity;
    } else if (category === 'Bottom') {
      bottoms[title] = (bottoms[title] || 0) + item.quantity;
    }
  });

  let totalDiscount = 0;
  const productTitles = new Set([...Object.keys(tops), ...Object.keys(bottoms)]);

  productTitles.forEach(title => {
    const sets = Math.min(tops[title] || 0, bottoms[title] || 0);
    totalDiscount += sets * 10;
  });

  return totalDiscount;
}

import { describe, it, expect } from 'vitest';
import { calculateSetDiscount } from '../lib/utils';
import { CartItem } from '../stores/cartStore';

describe('calculateSetDiscount', () => {
  const mockProduct = (id: string, title: string, category: string) => ({
    id,
    title,
    category,
    description: '',
    handle: '',
    price: { amount: '50.00', currencyCode: 'USD' },
    images: [],
    variants: [],
    options: []
  });

  it('returns 0 for an empty cart', () => {
    expect(calculateSetDiscount([])).toBe(0);
  });

  it('returns 0 when there are only tops', () => {
    const items: CartItem[] = [
      {
        lineId: null,
        product: mockProduct('1', 'Ocean Breeze', 'Top'),
        variantId: 'v1',
        variantTitle: 'S',
        price: { amount: '50.00', currencyCode: 'USD' },
        quantity: 2,
        selectedOptions: []
      }
    ];
    expect(calculateSetDiscount(items)).toBe(0);
  });

  it('returns 10 for one matching set', () => {
    const items: CartItem[] = [
      {
        lineId: null,
        product: mockProduct('1', 'Ocean Breeze', 'Top'),
        variantId: 'v1',
        variantTitle: 'S',
        price: { amount: '50.00', currencyCode: 'USD' },
        quantity: 1,
        selectedOptions: []
      },
      {
        lineId: null,
        product: mockProduct('2', 'Ocean Breeze', 'Bottom'),
        variantId: 'v2',
        variantTitle: 'S',
        price: { amount: '50.00', currencyCode: 'USD' },
        quantity: 1,
        selectedOptions: []
      }
    ];
    expect(calculateSetDiscount(items)).toBe(10);
  });

  it('returns 20 for two matching sets of the same product', () => {
    const items: CartItem[] = [
      {
        lineId: null,
        product: mockProduct('1', 'Ocean Breeze', 'Top'),
        variantId: 'v1',
        variantTitle: 'S',
        price: { amount: '50.00', currencyCode: 'USD' },
        quantity: 2,
        selectedOptions: []
      },
      {
        lineId: null,
        product: mockProduct('2', 'Ocean Breeze', 'Bottom'),
        variantId: 'v2',
        variantTitle: 'S',
        price: { amount: '50.00', currencyCode: 'USD' },
        quantity: 2,
        selectedOptions: []
      }
    ];
    expect(calculateSetDiscount(items)).toBe(20);
  });

  it('returns 10 when quantities are mismatched', () => {
    const items: CartItem[] = [
      {
        lineId: null,
        product: mockProduct('1', 'Ocean Breeze', 'Top'),
        variantId: 'v1',
        variantTitle: 'S',
        price: { amount: '50.00', currencyCode: 'USD' },
        quantity: 1,
        selectedOptions: []
      },
      {
        lineId: null,
        product: mockProduct('2', 'Ocean Breeze', 'Bottom'),
        variantId: 'v2',
        variantTitle: 'S',
        price: { amount: '50.00', currencyCode: 'USD' },
        quantity: 2,
        selectedOptions: []
      }
    ];
    expect(calculateSetDiscount(items)).toBe(10);
  });

  it('returns 0 for tops and bottoms of different products', () => {
    const items: CartItem[] = [
      {
        lineId: null,
        product: mockProduct('1', 'Ocean Breeze', 'Top'),
        variantId: 'v1',
        variantTitle: 'S',
        price: { amount: '50.00', currencyCode: 'USD' },
        quantity: 1,
        selectedOptions: []
      },
      {
        lineId: null,
        product: mockProduct('2', 'Midnight Sun', 'Bottom'),
        variantId: 'v2',
        variantTitle: 'S',
        price: { amount: '50.00', currencyCode: 'USD' },
        quantity: 1,
        selectedOptions: []
      }
    ];
    expect(calculateSetDiscount(items)).toBe(0);
  });
});

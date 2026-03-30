import { describe, it, expect } from 'vitest';
import { getCollectionKey, calculateSetDiscount } from '../lib/utils';
import type { CartItem } from '../stores/cartStore';

describe('getCollectionKey', () => {
  it('should strip bikini top/bottom suffixes', () => {
    expect(getCollectionKey('Copacabana Triangle White Bikini Top')).toBe('copacabana triangle white');
    expect(getCollectionKey('Copacabana Triangle White Bikini Bottom')).toBe('copacabana triangle white');
    expect(getCollectionKey('Maravilhosa Top')).toBe('maravilhosa');
    expect(getCollectionKey('Maravilhosa Bottom')).toBe('maravilhosa');
  });

  it('should normalize spaces and casing', () => {
    expect(getCollectionKey('  Bela   Black  Top  ')).toBe('bela black');
  });
});

describe('calculateSetDiscount', () => {
  const createItem = (title: string, category: string, price: string, quantity: number = 1): CartItem => ({
    lineId: null,
    product: {
      id: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      category,
      description: '',
      handle: title.toLowerCase().replace(/\s+/g, '-'),
      price: { amount: price, currencyCode: 'USD' },
      images: [],
      variants: [],
      options: []
    },
    variantId: `${title}-v`,
    variantTitle: 'S',
    price: { amount: price, currencyCode: 'USD' },
    quantity,
    selectedOptions: []
  });

  it('should calculate discount for a matching set', () => {
    const items = [
      createItem('Maravilhosa Top', 'Top', '45.00'),
      createItem('Maravilhosa Bottom', 'Bottom', '45.00'),
    ];
    // Maravilhosa set price is 80. Combined is 90. Discount should be 10.
    expect(calculateSetDiscount(items)).toBe(10);
  });

  it('should handle multiple quantities for sets', () => {
    const items = [
      createItem('Maravilhosa Top', 'Top', '45.00', 2),
      createItem('Maravilhosa Bottom', 'Bottom', '45.00', 2),
    ];
    expect(calculateSetDiscount(items)).toBe(20);
  });

  it('should handle mismatched quantities (partial sets)', () => {
    const items = [
      createItem('Maravilhosa Top', 'Top', '45.00', 2),
      createItem('Maravilhosa Bottom', 'Bottom', '45.00', 1),
    ];
    expect(calculateSetDiscount(items)).toBe(10);
  });

  it('should not discount mixed sets', () => {
    const items = [
      createItem('Maravilhosa Top', 'Top', '45.00'),
      createItem('Bela Black Bottom', 'Bottom', '45.00'),
    ];
    expect(calculateSetDiscount(items)).toBe(0);
  });

  it('should not discount if set price is higher than individual sum', () => {
    const items = [
      createItem('Boa Top', 'Top', '30.00'),
      createItem('Boa Bottom', 'Bottom', '30.00'),
    ];
    // Boa set price is 78. Combined is 60. No discount.
    expect(calculateSetDiscount(items)).toBe(0);
  });

  it('should handle multiple different collections', () => {
    const items = [
      createItem('Maravilhosa Top', 'Top', '45.00'),
      createItem('Maravilhosa Bottom', 'Bottom', '45.00'),
      createItem('Boa Top', 'Top', '50.00'),
      createItem('Boa Bottom', 'Bottom', '50.00'),
    ];
    // Maravilhosa discount: 90 - 80 = 10
    // Boa discount: 100 - 78 = 22
    // Total: 32
    expect(calculateSetDiscount(items)).toBe(32);
  });
});

import { describe, it, expect } from 'vitest';
import { getCollectionKey, calculateSetDiscount } from '../lib/utils';
import type { CartItem } from '../stores/cartStore';
import { toHandle } from '../hooks/useProducts';

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
      id: toHandle(title),
      title,
      category,
      description: '',
      handle: toHandle(title),
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

  it('should apply flat $10 discount for a matching set', () => {
    const items = [
      createItem('Maravilhosa Top', 'Top', '45.00'),
      createItem('Maravilhosa Bottom', 'Bottom', '45.00'),
    ];
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

  it('should apply $10 per matched pair regardless of price', () => {
    const items = [
      createItem('Boa Top', 'Top', '30.00'),
      createItem('Boa Bottom', 'Bottom', '30.00'),
    ];
    // Flat $10 off regardless of individual prices
    expect(calculateSetDiscount(items)).toBe(10);
  });

  it('should handle multiple different collections', () => {
    const items = [
      createItem('Maravilhosa Top', 'Top', '45.00'),
      createItem('Maravilhosa Bottom', 'Bottom', '45.00'),
      createItem('Boa Top', 'Top', '50.00'),
      createItem('Boa Bottom', 'Bottom', '50.00'),
    ];
    // $10 per matched pair × 2 = $20
    expect(calculateSetDiscount(items)).toBe(20);
  });
});

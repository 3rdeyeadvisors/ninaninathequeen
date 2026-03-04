import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCartStore } from '../stores/cartStore';

// Mock Product
const mockProduct: any = {
  id: '1',
  title: 'Test Product',
  price: '10.00',
  handle: 'test-product',
  images: [],
  variants: []
};

describe('cartStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useCartStore.getState().clearCart();
    useCartStore.getState().setUserEmail(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.lastUpdated).toBeNull();
    expect(state.userEmail).toBeNull();
  });

  it('should update lastUpdated when adding an item', () => {
    const before = Date.now();
    useCartStore.getState().addItem({
      product: mockProduct,
      variantId: 'v1',
      variantTitle: 'S',
      price: { amount: '10.00', currencyCode: 'USD' },
      quantity: 1,
      selectedOptions: []
    });
    const state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.lastUpdated).toBeGreaterThanOrEqual(before);
  });

  it('should update userEmail via setUserEmail', () => {
    const email = 'test@example.com';
    useCartStore.getState().setUserEmail(email);
    expect(useCartStore.getState().userEmail).toBe(email);
  });

  it('should update lastUpdated when updating quantity', () => {
    useCartStore.getState().addItem({
      product: mockProduct,
      variantId: 'v1',
      variantTitle: 'S',
      price: { amount: '10.00', currencyCode: 'USD' },
      quantity: 1,
      selectedOptions: []
    });
    const firstUpdate = useCartStore.getState().lastUpdated;

    // Ensure some time passes
    vi.advanceTimersByTime(100);

    useCartStore.getState().updateQuantity('v1', 2);
    expect(useCartStore.getState().lastUpdated).toBeGreaterThan(firstUpdate!);
  });

  it('should update lastUpdated when removing an item', () => {
    useCartStore.getState().addItem({
      product: mockProduct,
      variantId: 'v1',
      variantTitle: 'S',
      price: { amount: '10.00', currencyCode: 'USD' },
      quantity: 1,
      selectedOptions: []
    });
    const firstUpdate = useCartStore.getState().lastUpdated;

    vi.advanceTimersByTime(100);

    useCartStore.getState().removeItem('v1');
    expect(useCartStore.getState().lastUpdated).toBeGreaterThan(firstUpdate!);
  });
});

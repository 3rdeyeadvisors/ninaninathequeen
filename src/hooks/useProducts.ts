import { useAdminStore, type ProductOverride } from '@/stores/adminStore';
import { useMemo } from 'react';
import { PRODUCT_SIZES } from '@/lib/constants';

// Product type used throughout the app (fully flattened)
export interface Product {
  id: string;
  title: string;
  description: string;
  handle: string;
  productType?: string;
  category?: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  images: Array<{
    url: string;
    altText: string | null;
  }>;
  variants: Array<{
    id: string;
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    availableForSale: boolean;
    selectedOptions: Array<{
      name: string;
      value: string;
    }>;
  }>;
  options: Array<{
    name: string;
    values: string[];
  }>;
}

// Helper to convert override to product format
function overrideToProduct(override: ProductOverride): Product {
  const sizes = override.sizes || [...PRODUCT_SIZES];
  return {
    id: override.id,
    title: override.title,
    description: override.description || '',
    handle: override.title.toLowerCase().replace(/\s+/g, '-'),
    productType: override.productType,
    category: override.category,
    price: {
      amount: override.price || '0.00',
      currencyCode: 'USD',
    },
    images: (() => {
      // Use images array if available, fall back to single image
      const imgArray = override.images?.filter(Boolean);
      if (imgArray && imgArray.length > 0) {
        return imgArray.map(url => ({ url, altText: override.title }));
      }
      return override.image ? [{ url: override.image, altText: override.title }] : [];
    })(),
    variants: sizes.map(size => ({
      id: `${override.id}-${size.toLowerCase()}`,
      title: size,
      price: { amount: override.price || '0.00', currencyCode: 'USD' },
      availableForSale: (override.sizeInventory?.[size] ?? 0) > 0,
      selectedOptions: [{ name: 'Size', value: size }],
    })),
    options: [{ name: 'Size', values: sizes }],
  };
}

export function useProducts(first: number = 20, query?: string, includeHidden: boolean = false) {
  const { productOverrides, _hasHydrated } = useAdminStore();

  const { products, totalCount } = useMemo(() => {
    // Wait for store hydration
    if (!_hasHydrated) return { products: [], totalCount: 0 };

    // Only use products from database (via productOverrides store)
    const allProducts: Product[] = Object.values(productOverrides)
      .filter(o => !o.isDeleted && o.title && (includeHidden || o.status !== 'Inactive'))
      .map(overrideToProduct);

    // Apply search/category filter
    let filteredProducts = allProducts;
    if (query) {
      const q = query.toLowerCase();
      // Map URL params to database category values
      const categoryMap: Record<string, string[]> = {
        tops: ['Top', 'Top & Bottom'],
        bottoms: ['Bottom', 'Top & Bottom'],
        'one-pieces': ['One-Piece'],
      };
      const matchCategories = categoryMap[q];
      
      if (matchCategories) {
        // Filter by category field
        filteredProducts = allProducts.filter(p => 
          matchCategories.includes(p.category || '')
        );
      } else {
        // Fallback to text search
        filteredProducts = allProducts.filter(p => {
          const title = p.title.toLowerCase();
          const type = (p.productType || '').toLowerCase();
          return title.includes(q) || type.includes(q);
        });
      }
    }

    return {
      products: filteredProducts.slice(0, first),
      totalCount: filteredProducts.length
    };
  }, [productOverrides, _hasHydrated, first, query, includeHidden]);

  return {
    data: products,
    totalCount: totalCount || 0,
    isLoading: !_hasHydrated,
    isError: false,
  };
}

export function useProduct(handle: string) {
  const { productOverrides, _hasHydrated } = useAdminStore();

  const product = useMemo(() => {
    if (!_hasHydrated) return null;

    // Find product in overrides by handle
    const override = Object.values(productOverrides).find(
      o => o.title && o.title.toLowerCase().replace(/\s+/g, '-') === handle && !o.isDeleted
    );

    return override ? overrideToProduct(override) : null;
  }, [productOverrides, handle, _hasHydrated]);

  return {
    data: product,
    isLoading: !_hasHydrated,
    isError: false,
  };
}

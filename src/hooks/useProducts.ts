import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductByHandle, ShopifyProduct, mapMockToShopify } from '@/lib/shopify';
import { useAdminStore } from '@/stores/adminStore';
import { useMemo } from 'react';
import { mergeProductsWithOverrides, mergeProductWithOverride } from '@/lib/productUtils';
import { MOCK_PRODUCTS } from '@/lib/mockData';

export function useProducts(first: number = 20, query?: string) {
  const { productOverrides, _hasHydrated } = useAdminStore();

  const productsQuery = useQuery({
    queryKey: ['products', first, query],
    queryFn: () => fetchProducts(first, query),
    // Prevent constant refetching that causes flickering
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const mergedData = useMemo(() => {
    // Wait for store hydration to prevent data flickering
    if (!_hasHydrated) return [];

    // Get base products (from API or fallback to mock)
    let baseProducts = productsQuery.data;
    
    // If no API data, use mock products as base
    if (!baseProducts || baseProducts.length === 0) {
      baseProducts = MOCK_PRODUCTS.slice(0, first).map(mapMockToShopify);
    }

    // Create products from overrides that don't exist in base products
    const overrideOnlyProducts: ShopifyProduct[] = [];
    Object.entries(productOverrides).forEach(([id, override]) => {
      if (override.isDeleted) return;
      
      // Check if this override already exists in base products
      const existsInBase = baseProducts!.some(p => p.node.id === id);
      if (!existsInBase && override.title) {
        // Create a synthetic product from the override
        overrideOnlyProducts.push({
          node: {
            id: id,
            title: override.title,
            description: override.description || '',
            handle: override.title.toLowerCase().replace(/\s+/g, '-'),
            productType: override.productType,
            priceRange: {
              minVariantPrice: {
                amount: override.price || '0.00',
                currencyCode: 'USD',
              },
            },
            images: {
              edges: override.image ? [{ node: { url: override.image, altText: override.title } }] : [],
            },
            variants: {
              edges: (override.sizes || []).map(size => ({
                node: {
                  id: `${id}-${size.toLowerCase()}`,
                  title: size,
                  price: { amount: override.price || '0.00', currencyCode: 'USD' },
                  availableForSale: true,
                  selectedOptions: [{ name: 'Size', value: size }],
                },
              })),
            },
            options: [{ name: 'Size', values: override.sizes || [] }],
          },
        });
      }
    });

    // Combine base products with override-only products
    const allProducts = [...baseProducts, ...overrideOnlyProducts];
    
    // Merge with overrides and filter out deleted
    return mergeProductsWithOverrides(allProducts, productOverrides);
  }, [productsQuery.data, productOverrides, _hasHydrated, first]);

  return {
    ...productsQuery,
    data: mergedData,
    // Consider it loading only if store hasn't hydrated OR (query is loading AND we have no data)
    isLoading: !_hasHydrated || (productsQuery.isLoading && mergedData.length === 0),
  };
}

export function useProduct(handle: string) {
  const { productOverrides } = useAdminStore();

  const productQuery = useQuery({
    queryKey: ['product', handle],
    queryFn: () => fetchProductByHandle(handle),
    enabled: !!handle,
  });

  const mergedData = useMemo(() => {
    // First try to find it in overrides by handle if not found in Shopify/Mock
    if (!productQuery.data) {
      const overrideByHandle = Object.values(productOverrides).find(
        o => o.title.toLowerCase().replace(/ /g, '-') === handle && !o.isDeleted
      );
      if (overrideByHandle) {
        // Create a dummy node to merge with
        const dummyNode = {
          id: overrideByHandle.id,
          title: overrideByHandle.title,
          description: overrideByHandle.description || "",
          handle: handle,
          priceRange: { minVariantPrice: { amount: overrideByHandle.price, currencyCode: 'USD' } },
          images: { edges: [] },
          variants: { edges: [] },
          options: []
        } as any;
        return mergeProductWithOverride(dummyNode, productOverrides);
      }
      return null;
    }
    return mergeProductWithOverride(productQuery.data, productOverrides);
  }, [productQuery.data, productOverrides, handle]);

  return {
    ...productQuery,
    data: mergedData,
  };
}

export type { ShopifyProduct };

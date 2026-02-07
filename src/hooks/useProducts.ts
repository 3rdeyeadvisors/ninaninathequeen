import { useQuery } from '@tanstack/react-query';
import { fetchProducts, fetchProductByHandle, ShopifyProduct } from '@/lib/shopify';
import { useAdminStore } from '@/stores/adminStore';
import { useMemo } from 'react';
import { mergeProductsWithOverrides, mergeProductWithOverride } from '@/lib/productUtils';

export function useProducts(first: number = 20, query?: string) {
  const { productOverrides } = useAdminStore();

  const productsQuery = useQuery({
    queryKey: ['products', first, query],
    queryFn: () => fetchProducts(first, query),
  });

  const mergedData = useMemo(() => {
    if (!productsQuery.data) return productsQuery.data;
    return mergeProductsWithOverrides(productsQuery.data, productOverrides);
  }, [productsQuery.data, productOverrides]);

  return {
    ...productsQuery,
    data: mergedData,
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

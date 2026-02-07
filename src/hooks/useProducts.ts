import { useAdminStore, type ProductOverride } from '@/stores/adminStore';
import { useMemo } from 'react';
import { PRODUCT_SIZES } from '@/lib/constants';
import { MOCK_PRODUCTS, type MockProduct } from '@/lib/mockData';

// Product type used throughout the app (simplified from Shopify format)
export interface Product {
  node: {
    id: string;
    title: string;
    description: string;
    handle: string;
    productType?: string;
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    images: {
      edges: Array<{
        node: {
          url: string;
          altText: string | null;
        };
      }>;
    };
    variants: {
      edges: Array<{
        node: {
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
        };
      }>;
    };
    options: Array<{
      name: string;
      values: string[];
    }>;
  };
}

// Helper to convert mock product to standard format
function mapMockToProduct(product: MockProduct): Product {
  return {
    node: {
      id: `product-${product.id}`,
      title: product.title,
      description: "Experience the ultimate in Brazilian luxury. Our collection is handcrafted using sustainable, high-performance fabrics.",
      handle: product.handle,
      productType: product.productType,
      priceRange: {
        minVariantPrice: {
          amount: product.price.toString(),
          currencyCode: "USD",
        },
      },
      images: {
        edges: product.images.map((url: string) => ({
          node: { url, altText: product.title },
        })),
      },
      variants: {
        edges: product.sizes.map(size => ({
          node: {
            id: `${product.id}-${size.toLowerCase()}`,
            title: size,
            price: { amount: product.price.toString(), currencyCode: "USD" },
            availableForSale: true,
            selectedOptions: [{ name: "Size", value: size }],
          },
        })),
      },
      options: [{ name: "Size", values: product.sizes }],
    },
  };
}

// Helper to convert override to product format
function overrideToProduct(override: ProductOverride): Product {
  const sizes = override.sizes || [...PRODUCT_SIZES];
  return {
    node: {
      id: override.id,
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
        edges: sizes.map(size => ({
          node: {
            id: `${override.id}-${size.toLowerCase()}`,
            title: size,
            price: { amount: override.price || '0.00', currencyCode: 'USD' },
            availableForSale: true,
            selectedOptions: [{ name: 'Size', value: size }],
          },
        })),
      },
      options: [{ name: 'Size', values: sizes }],
    },
  };
}

export function useProducts(first: number = 20, query?: string) {
  const { productOverrides, _hasHydrated } = useAdminStore();

  const products = useMemo(() => {
    // Wait for store hydration
    if (!_hasHydrated) return [];

    // Start with mock products as base
    const mockProducts: Product[] = MOCK_PRODUCTS.map(mapMockToProduct);
    
    // Get IDs of mock products
    const mockIds = new Set(mockProducts.map(p => p.node.id));
    
    // Get new products from overrides (not mock products)
    const newOverrideProducts: Product[] = Object.values(productOverrides)
      .filter(o => !o.isDeleted && o.title && !mockIds.has(o.id))
      .map(overrideToProduct);
    
    // Merge: Apply overrides to mock products + add new products
    const mergedMockProducts = mockProducts
      .map(p => {
        const override = productOverrides[p.node.id];
        if (override?.isDeleted) return null; // Skip deleted
        if (override) {
          // Merge override with mock product
          const sizes = override.sizes || p.node.options[0]?.values || [...PRODUCT_SIZES];
          return {
            node: {
              ...p.node,
              title: override.title || p.node.title,
              description: override.description || p.node.description,
              productType: override.productType || p.node.productType,
              priceRange: {
                minVariantPrice: {
                  amount: override.price || p.node.priceRange.minVariantPrice.amount,
                  currencyCode: 'USD',
                },
              },
              images: override.image ? {
                edges: [{ node: { url: override.image, altText: override.title || p.node.title } }]
              } : p.node.images,
              variants: {
                edges: sizes.map(size => ({
                  node: {
                    id: `${p.node.id}-${size.toLowerCase()}`,
                    title: size,
                    price: { amount: override.price || p.node.priceRange.minVariantPrice.amount, currencyCode: 'USD' },
                    availableForSale: true,
                    selectedOptions: [{ name: 'Size', value: size }],
                  },
                })),
              },
              options: [{ name: 'Size', values: sizes }],
            },
          };
        }
        return p;
      })
      .filter((p): p is Product => p !== null);

    let allProducts = [...mergedMockProducts, ...newOverrideProducts];

    // Apply search filter
    if (query) {
      const q = query.toLowerCase();
      allProducts = allProducts.filter(p => {
        const title = p.node.title.toLowerCase();
        const type = (p.node.productType || '').toLowerCase();
        return title.includes(q) || type.includes(q);
      });
    }

    return allProducts.slice(0, first);
  }, [productOverrides, _hasHydrated, first, query]);

  return {
    data: products,
    isLoading: !_hasHydrated,
    isError: false,
  };
}

export function useProduct(handle: string) {
  const { productOverrides, _hasHydrated } = useAdminStore();

  const product = useMemo(() => {
    if (!_hasHydrated) return null;

    // First check overrides
    const override = Object.values(productOverrides).find(
      o => o.title.toLowerCase().replace(/\s+/g, '-') === handle && !o.isDeleted
    );

    if (override) {
      return overrideToProduct(override).node;
    }

    // Fall back to mock products
    const mockProduct = MOCK_PRODUCTS.find(p => p.handle === handle);
    return mockProduct ? mapMockToProduct(mockProduct).node : null;
  }, [productOverrides, handle, _hasHydrated]);

  return {
    data: product,
    isLoading: !_hasHydrated,
    isError: false,
  };
}

// Re-export the Product type for use in other files
export type { Product as ShopifyProduct };

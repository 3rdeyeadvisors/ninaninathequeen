import { ShopifyProduct } from './shopify';
import { ProductOverride } from '@/stores/adminStore';
import { PRODUCT_SIZES } from './constants';

export function mergeProductsWithOverrides(
  initialProducts: ShopifyProduct[],
  productOverrides: Record<string, ProductOverride>
): ShopifyProduct[] {
  if (!initialProducts) return [];

  const overridenProducts = initialProducts.map(p => {
    const override = productOverrides[p.node.id];
    if (override) {
      const sizes = override.sizes || (p.node.options.find(o => o.name === 'Size')?.values) || [...PRODUCT_SIZES];
      return {
        ...p,
        node: {
          ...p.node,
          title: override.title || p.node.title,
          description: override.description || p.node.description,
          productType: override.productType || p.node.productType,
          priceRange: {
            ...p.node.priceRange,
            minVariantPrice: {
              ...p.node.priceRange.minVariantPrice,
              amount: override.price || p.node.priceRange.minVariantPrice.amount
            }
          },
          images: {
            ...p.node.images,
            edges: override.image ? [
              {
                node: {
                  url: override.image,
                  altText: override.title || p.node.title
                }
              },
              ...p.node.images.edges.slice(1)
            ] : p.node.images.edges
          },
          variants: {
            edges: sizes.map(size => ({
              node: {
                id: `gid://shopify/ProductVariant/${p.node.id}-${size.toLowerCase()}`,
                title: size,
                price: { amount: override.price || p.node.priceRange.minVariantPrice.amount, currencyCode: "USD" },
                availableForSale: true,
                selectedOptions: [{ name: "Size", value: size }],
              }
            }))
          },
          options: [{ name: "Size", values: sizes }]
        }
      };
    }
    return p;
  }).filter(p => !productOverrides[p.node.id]?.isDeleted);

  const existingIds = new Set(initialProducts.map(p => p.node.id));
  const newProducts = Object.values(productOverrides)
    .filter(o => !existingIds.has(o.id) && !o.isDeleted)
    .map(o => {
      const sizes = o.sizes || [...PRODUCT_SIZES];
      return {
        node: {
          id: o.id,
          title: o.title,
          description: o.description || "",
          productType: o.productType || "",
          handle: o.title.toLowerCase().replace(/ /g, '-'),
          priceRange: {
            minVariantPrice: { amount: o.price, currencyCode: 'USD' }
          },
          images: {
            edges: [{ node: { url: o.image, altText: o.title } }]
          },
          variants: {
            edges: sizes.map(size => ({
              node: {
                id: `gid://shopify/ProductVariant/${o.id}-${size.toLowerCase()}`,
                title: size,
                price: { amount: o.price, currencyCode: "USD" },
                availableForSale: true,
                selectedOptions: [{ name: "Size", value: size }],
              }
            }))
          },
          options: [{ name: "Size", values: sizes }]
        }
      };
    }) as ShopifyProduct[];

  return [...overridenProducts, ...newProducts];
}

export function mergeProductWithOverride(
  product: ShopifyProduct['node'] | null,
  productOverrides: Record<string, ProductOverride>
): ShopifyProduct['node'] | null {
  if (!product) return null;

  const override = productOverrides[product.id];
  if (!override || override.isDeleted) return override?.isDeleted ? null : product;

  const sizes = override.sizes || (product.options.find(o => o.name === 'Size')?.values) || [...PRODUCT_SIZES];

  return {
    ...product,
    title: override.title || product.title,
    description: override.description || product.description,
    productType: override.productType || product.productType,
    priceRange: {
      ...product.priceRange,
      minVariantPrice: {
        ...product.priceRange.minVariantPrice,
        amount: override.price || product.priceRange.minVariantPrice.amount
      }
    },
    images: {
      ...product.images,
      edges: override.image ? [
        {
          node: {
            url: override.image,
            altText: override.title || product.title
          }
        },
        ...product.images.edges.slice(1)
      ] : product.images.edges
    },
    variants: {
      edges: sizes.map(size => ({
        node: {
          id: `gid://shopify/ProductVariant/${product.id}-${size.toLowerCase()}`,
          title: size,
          price: { amount: override.price || product.priceRange.minVariantPrice.amount, currencyCode: "USD" },
          availableForSale: true,
          selectedOptions: [{ name: "Size", value: size }],
        }
      }))
    },
    options: [{ name: "Size", values: sizes }]
  };
}

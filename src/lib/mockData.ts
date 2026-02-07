import { PRODUCT_SIZES } from './constants';

export interface MockProduct {
  id: string;
  title: string;
  handle: string;
  price: number;
  category: 'Top' | 'Bottom' | 'One-Piece' | 'Cover-up';
  productType: string;
  images: string[];
  colors: string[];
  sizes: string[];
}

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'm1',
    title: 'Copacabana Triangle Top',
    handle: 'copacabana-triangle-top',
    price: 85.00,
    category: 'Top',
    productType: 'Bikini',
    images: [
      'https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?auto=format&fit=crop&q=80&w=800'
    ],
    colors: ['Gold', 'Sand', 'Noir'],
    sizes: [...PRODUCT_SIZES]
  },
  {
    id: 'm2',
    title: 'Copacabana Tie Bottom',
    handle: 'copacabana-tie-bottom',
    price: 75.00,
    category: 'Bottom',
    productType: 'Bikini',
    images: [
      'https://images.unsplash.com/photo-1585924756944-b82af627eca9?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'
    ],
    colors: ['Gold', 'Sand', 'Noir'],
    sizes: [...PRODUCT_SIZES]
  },
  {
    id: 'm3',
    title: 'Ipanema Bandeau Top',
    handle: 'ipanema-bandeau-top',
    price: 90.00,
    category: 'Top',
    productType: 'Bikini',
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800'
    ],
    colors: ['Emerald', 'Noir'],
    sizes: [...PRODUCT_SIZES]
  },
  {
    id: 'm4',
    title: 'Ipanema High Waist Bottom',
    handle: 'ipanema-high-waist-bottom',
    price: 85.00,
    category: 'Bottom',
    productType: 'Bikini',
    images: [
      'https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?auto=format&fit=crop&q=80&w=800'
    ],
    colors: ['Emerald', 'Noir'],
    sizes: [...PRODUCT_SIZES]
  },
  {
    id: 'm5',
    title: 'Leblon Underwire Top',
    handle: 'leblon-underwire-top',
    price: 95.00,
    category: 'Top',
    productType: 'Bikini',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'
    ],
    colors: ['Pearl', 'Midnight'],
    sizes: [...PRODUCT_SIZES]
  },
  {
    id: 'm6',
    title: 'Leblon Cheeky Bottom',
    handle: 'leblon-cheeky-bottom',
    price: 70.00,
    category: 'Bottom',
    productType: 'Bikini',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800'
    ],
    colors: ['Pearl', 'Midnight'],
    sizes: [...PRODUCT_SIZES]
  },
  {
    id: 'm7',
    title: 'Rio De Janeiro One-Piece',
    handle: 'rio-one-piece',
    price: 165.00,
    category: 'One-Piece',
    productType: 'One-Piece',
    images: [
      'https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?auto=format&fit=crop&q=80&w=800'
    ],
    colors: ['Sunset Noir', 'Electric Blue'],
    sizes: [...PRODUCT_SIZES]
  }
];

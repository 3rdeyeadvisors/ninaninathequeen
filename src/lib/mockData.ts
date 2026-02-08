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

// Mock products array is now empty - all products come from database
export const MOCK_PRODUCTS: MockProduct[] = [];

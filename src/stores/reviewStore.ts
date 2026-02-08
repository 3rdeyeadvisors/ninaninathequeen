import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  likes: string[]; // Array of user IDs who liked the review
  adminComment?: {
    text: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  };
  createdAt: string;
}

interface ReviewStore {
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'likes' | 'createdAt'>) => void;
  likeReview: (reviewId: string, userId: string) => void;
  addAdminComment: (reviewId: string, comment: string, authorName: string, authorRole: string) => void;
  getReviewsForProduct: (productId: string) => Review[];
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [
        {
          id: 'r1',
          productId: 'product-m1',
          userId: 'u1',
          userName: 'Isabella Silva',
          userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
          rating: 5,
          comment: 'The quality of the Copacabana set is absolutely stunning. The fabric feels like a second skin and the gold hardware is so luxurious!',
          likes: ['u2', 'u3'],
          adminComment: {
            text: 'Thank you so much Isabella! We are thrilled you love the craftsmanship.',
            authorName: 'Lydia',
            authorRole: 'Founder & Owner',
            createdAt: '2025-05-16T10:00:00Z'
          },
          createdAt: '2025-05-15T14:30:00Z'
        },
        {
          id: 'r2',
          productId: 'product-m1',
          userId: 'u2',
          userName: 'Camila Santos',
          rating: 4,
          comment: 'Perfect fit and beautiful color. Only wish it came in a reusable pouch!',
          likes: ['u1'],
          createdAt: '2025-05-10T09:15:00Z'
        }
      ],

      addReview: (reviewData) => {
        const newReview: Review = {
          ...reviewData,
          id: Math.random().toString(36).substring(2, 9),
          likes: [],
          createdAt: new Date().toISOString()
        };
        set((state) => ({ reviews: [newReview, ...state.reviews] }));
      },

      likeReview: (reviewId, userId) => {
        set((state) => ({
          reviews: state.reviews.map((r) => {
            if (r.id === reviewId) {
              const likes = r.likes.includes(userId)
                ? r.likes.filter((id) => id !== userId)
                : [...r.likes, userId];
              return { ...r, likes };
            }
            return r;
          })
        }));
      },

      addAdminComment: (reviewId, text, authorName, authorRole) => {
        set((state) => ({
          reviews: state.reviews.map((r) => {
            if (r.id === reviewId) {
              return {
                ...r,
                adminComment: {
                  text,
                  authorName,
                  authorRole,
                  createdAt: new Date().toISOString()
                }
              };
            }
            return r;
          })
        }));
      },

      getReviewsForProduct: (productId) => {
        return get().reviews.filter((r) => r.productId === productId);
      }
    }),
    {
      name: 'nina-armend-reviews',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

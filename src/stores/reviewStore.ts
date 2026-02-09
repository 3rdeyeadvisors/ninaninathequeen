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
      reviews: [],

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

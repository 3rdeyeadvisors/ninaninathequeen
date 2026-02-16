import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DbReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  rating: number;
  comment: string;
  likes: string[];
  admin_comment: {
    text: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  } | null;
  created_at: string;
}

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DbReview[];
    },
  });
}

export function useTestimonials() {
  return useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .gte('rating', 4)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      // Filter by comment length client-side since SQL length filter isn't available via SDK
      return ((data || []) as unknown as DbReview[]).filter(r => r.comment.length >= 20).slice(0, 3);
    },
  });
}

export function useAddReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: {
      product_id: string;
      user_id: string;
      user_name: string;
      user_avatar?: string;
      rating: number;
      comment: string;
    }) => {
      const { error } = await supabase
        .from('reviews')
        .insert({
          product_id: review.product_id,
          user_id: review.user_id,
          user_name: review.user_name,
          user_avatar: review.user_avatar || null,
          rating: review.rating,
          comment: review.comment,
        });
      if (error) throw error;

      // Award 10 points
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, points')
          .eq('id', review.user_id)
          .maybeSingle();
        if (profile) {
          await supabase
            .from('profiles')
            .update({ points: (profile.points || 0) + 10 })
            .eq('id', profile.id)
            .select('id')
            .maybeSingle();
        }
      } catch (err) {
        console.error('Failed to award review points:', err);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, userId, productId }: { reviewId: string; userId: string; productId: string }) => {
      // Fetch current likes
      const { data: review, error: fetchErr } = await supabase
        .from('reviews')
        .select('likes')
        .eq('id', reviewId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!review) return;

      const currentLikes = (review.likes || []) as string[];
      const newLikes = currentLikes.includes(userId)
        ? currentLikes.filter(id => id !== userId)
        : [...currentLikes, userId];

      const { error } = await supabase
        .from('reviews')
        .update({ likes: newLikes })
        .eq('id', reviewId)
        .select('id')
        .maybeSingle();
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
    },
  });
}

export function useAddAdminComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, text, authorName, authorRole, productId }: {
      reviewId: string;
      text: string;
      authorName: string;
      authorRole: string;
      productId: string;
    }) => {
      const { error } = await supabase
        .from('reviews')
        .update({
          admin_comment: {
            text,
            authorName,
            authorRole,
            createdAt: new Date().toISOString(),
          },
        })
        .eq('id', reviewId)
        .select('id')
        .maybeSingle();
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
    },
  });
}

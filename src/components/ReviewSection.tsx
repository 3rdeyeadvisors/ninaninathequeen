import { useState } from 'react';
import { useReviewStore, type Review } from '@/stores/reviewStore';
import { useAuthStore, ADMIN_EMAIL } from '@/stores/authStore';
import { useCloudAuthStore } from '@/stores/cloudAuthStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, MessageSquare, ShieldCheck, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Input validation constants
const MAX_REVIEW_LENGTH = 1000;
const MIN_REVIEW_LENGTH = 10;
const MAX_REPLY_LENGTH = 500;

interface ReviewSectionProps {
  productId: string;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
  const cloudAuth = useCloudAuthStore();
  
  // Primary auth check via Cloud Auth
  const isAuthenticated = cloudAuth.isAuthenticated;
  const user = cloudAuth.user ? {
    email: cloudAuth.user.email,
    name: cloudAuth.user.name || cloudAuth.user.email.split('@')[0],
    avatar: cloudAuth.user.avatar,
    role: cloudAuth.user.isAdmin ? 'Admin' : undefined,
  } : null;
  
  const isAdmin = cloudAuth.isAuthenticated && (cloudAuth.user?.isAdmin || cloudAuth.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  
  const { reviews, addReview, likeReview, addAdminComment } = useReviewStore();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');

  const productReviews = reviews.filter(r => r.productId === productId);
  const averageRating = productReviews.length > 0
    ? productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length
    : 0;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to leave a review");
      return;
    }
    
    // Input validation
    const trimmedComment = newComment.trim();
    
    if (trimmedComment.length < MIN_REVIEW_LENGTH) {
      toast.error(`Review must be at least ${MIN_REVIEW_LENGTH} characters`);
      return;
    }
    
    if (trimmedComment.length > MAX_REVIEW_LENGTH) {
      toast.error(`Review cannot exceed ${MAX_REVIEW_LENGTH} characters`);
      return;
    }

    if (!user) return;
    
    addReview({
      productId,
      userId: user.email,
      userName: user.name || 'Anonymous',
      userAvatar: user.avatar,
      rating: newRating,
      comment: trimmedComment
    });

    setNewComment('');
    setNewRating(5);
    toast.success("Review submitted! Thank you.");
  };

  const handleAdminReply = (reviewId: string) => {
    // Input validation for admin reply
    const trimmedReply = adminReply.trim();
    
    if (!trimmedReply) {
      toast.error("Please enter a reply");
      return;
    }
    
    if (trimmedReply.length > MAX_REPLY_LENGTH) {
      toast.error(`Reply cannot exceed ${MAX_REPLY_LENGTH} characters`);
      return;
    }
    
    if (!user) return;
    
    addAdminComment(reviewId, trimmedReply, user.name, user.role || 'Owner');
    setAdminReply('');
    setReplyingTo(null);
    toast.success("Reply posted.");
  };

  return (
    <div className="mt-20 border-t border-border pt-16">
      <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-8">
        <div>
          <h2 className="font-serif text-3xl mb-2">Customer Reviews</h2>
          <div className="flex items-center gap-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-5 w-5 ${s <= Math.round(averageRating) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              ))}
            </div>
            <span className="text-sm font-sans text-muted-foreground">
              Based on {productReviews.length} reviews
            </span>
          </div>
        </div>

        {isAuthenticated && !isAdmin && (
          <div className="w-full md:w-1/2">
            <Card className="border-primary/10 shadow-sm">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-sans uppercase tracking-widest text-muted-foreground">Rating</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNewRating(s)}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star className={`h-6 w-6 ${s <= newRating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Textarea
                      placeholder="Share your experience..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[100px] bg-secondary/20 border-border/50 focus:ring-primary"
                      maxLength={MAX_REVIEW_LENGTH}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{newComment.length < MIN_REVIEW_LENGTH ? `Min ${MIN_REVIEW_LENGTH} characters` : ''}</span>
                      <span>{newComment.length} / {MAX_REVIEW_LENGTH}</span>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans uppercase tracking-widest text-xs">
                    Post Review
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="space-y-8">
        {productReviews.length === 0 ? (
          <div className="text-center py-12 bg-secondary/20 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground font-sans">No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          productReviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-sm"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="h-12 w-12 border border-primary/10">
                    <AvatarImage src={review.userAvatar} />
                    <AvatarFallback><User className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                    <div>
                      <h4 className="font-sans font-bold text-sm uppercase tracking-tight">{review.userName}</h4>
                      <div className="flex mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-muted-foreground leading-relaxed mb-6 italic">"{review.comment}"</p>

                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => isAuthenticated && user && likeReview(review.id, user.email)}
                      className={`flex items-center gap-2 text-[10px] uppercase tracking-widest transition-colors ${
                        user && review.likes.includes(user.email) ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${user && review.likes.includes(user.email) ? 'fill-current' : ''}`} />
                      <span>{review.likes.length} Likes</span>
                    </button>

                    {isAdmin && !review.adminComment && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                        className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Reply</span>
                      </button>
                    )}
                  </div>

                  {/* Admin Reply Form */}
                  <AnimatePresence>
                    {replyingTo === review.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-6 overflow-hidden"
                      >
                        <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                          <div className="space-y-1">
                            <Textarea
                              placeholder="Write your response as Owner..."
                              value={adminReply}
                              onChange={(e) => setAdminReply(e.target.value)}
                              className="bg-secondary/30 border-primary/20 focus:ring-primary min-h-[80px]"
                              maxLength={MAX_REPLY_LENGTH}
                            />
                            <div className="text-right text-[10px] text-muted-foreground">
                              {adminReply.length} / {MAX_REPLY_LENGTH}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAdminReply(review.id)} className="bg-primary">
                              Post Reply
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Existing Admin Comment */}
                  {review.adminComment && (
                    <div className="mt-8 pl-6 border-l-2 border-primary/20 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-primary">
                          {review.adminComment.authorName} — {review.adminComment.authorRole}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-sans">
                        {review.adminComment.text}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

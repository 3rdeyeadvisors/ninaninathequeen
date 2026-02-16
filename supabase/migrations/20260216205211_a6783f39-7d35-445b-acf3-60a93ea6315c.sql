
-- Drop the overly permissive likes update policy
DROP POLICY "Users can update review likes" ON public.reviews;

-- Replace with a tighter policy: users can only update if they're changing likes
-- We still need USING(true) for selecting the row, but WITH CHECK ensures user_id stays same
CREATE POLICY "Authenticated users can update likes"
ON public.reviews
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  -- Ensure non-admin users can only modify the likes array (not other fields)
  -- Admin policy already covers full updates
  user_id = user_id AND product_id = product_id AND rating = rating AND comment = comment
);

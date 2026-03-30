-- Make `reviews.user_id` nullable so we can import legacy anonymous Bubble reviews.
-- This migration is required for `scripts/migrate-bubble-reviews.js` to insert reviews with `user_id = null`.

alter table public.reviews
  alter column user_id drop not null;

-- Refresh PostgREST schema cache so API sees new constraints immediately.
notify pgrst, 'reload schema';


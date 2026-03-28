-- Add an ownership flag to the anonymity-safe reviews view so the frontend
-- can show Edit/Delete only for the authenticated user's own reviews.
--
-- Important: we explicitly list columns and append `is_owner` at the end to
-- avoid Postgres column re-mapping errors when replacing the view.
create or replace view public.public_reviews (
  id,
  company_id,
  company_name,
  is_anonymous,
  reviewer_name,
  work_email_verified,
  job_title,
  employment_status,
  rating_overall,
  rating_culture,
  rating_management,
  rating_growth,
  rating_worklife,
  pros,
  cons,
  created_at,
  is_owner
) as
select
  r.id,
  r.company_id,
  c.name as company_name,
  r.is_anonymous,
  case
    when r.is_anonymous then 'Anonymous'
    else coalesce(p.full_name, 'Anonymous')
  end as reviewer_name,
  r.work_email_verified,
  r.job_title,
  r.employment_status,
  r.rating_overall,
  r.rating_culture,
  r.rating_management,
  r.rating_growth,
  r.rating_worklife,
  r.pros,
  r.cons,
  r.created_at,
  -- Frontend-safe ownership flag (does not expose raw user_id).
  (auth.uid() = r.user_id) as is_owner
from public.reviews r
join public.companies c on c.id = r.company_id
left join public.profiles p on p.id = r.user_id;

grant select on public.public_reviews to anon, authenticated;

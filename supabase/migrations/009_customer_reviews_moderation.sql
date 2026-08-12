-- Customer reviews submitted from the public Amwaj website.
-- Public visitors may submit only pending reviews; publication is an admin-only moderation action.

create table public.customer_reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 90),
  rating smallint not null check (rating between 1 and 5),
  review_text text not null check (char_length(btrim(review_text)) between 10 and 1200),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  is_featured boolean not null default false,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_reviews_moderation_state_check check (
    (status = 'pending' and reviewed_at is null)
    or (status in ('approved', 'rejected') and reviewed_at is not null)
  )
);

comment on table public.customer_reviews is
  'Visitor-submitted customer reviews. Public clients create pending records and see approved records only; Amwaj admins moderate every submission.';
comment on column public.customer_reviews.customer_name is
  'Display name submitted by the visitor. No account or contact details are stored in this review module.';
comment on column public.customer_reviews.review_text is
  'Plain-text review body. Clients must escape this value before rendering it as HTML.';

create index customer_reviews_public_listing_idx
  on public.customer_reviews (reviewed_at desc, submitted_at desc)
  where status = 'approved';

create index customer_reviews_admin_queue_idx
  on public.customer_reviews (status, submitted_at desc);

create or replace function private.normalize_customer_review_submission()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.status := 'pending';
  new.reviewed_at := null;
  new.is_featured := false;
  new.submitted_at := now();
  new.updated_at := now();
  return new;
end;
$$;

create trigger customer_reviews_force_pending_submission
  before insert on public.customer_reviews
  for each row execute procedure private.normalize_customer_review_submission();

create trigger customer_reviews_set_updated_at
  before update on public.customer_reviews
  for each row execute procedure private.set_updated_at();

alter table public.customer_reviews enable row level security;

revoke all on table public.customer_reviews from anon, authenticated;
grant select, insert on table public.customer_reviews to anon, authenticated;
grant select, insert, update, delete on table public.customer_reviews to service_role;
grant update, delete on table public.customer_reviews to authenticated;

create policy customer_reviews_read_approved_or_admin
  on public.customer_reviews for select to anon, authenticated
  using (status = 'approved' or (select private.is_admin()));

create policy customer_reviews_insert_pending
  on public.customer_reviews for insert to anon, authenticated
  with check (
    status = 'pending'
    and reviewed_at is null
    and is_featured = false
  );

create policy customer_reviews_update_admin
  on public.customer_reviews for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy customer_reviews_delete_admin
  on public.customer_reviews for delete to authenticated
  using ((select private.is_admin()));

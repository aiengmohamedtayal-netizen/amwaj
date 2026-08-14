-- Immutable audit trail for actions confirmed and executed through the Amwaj Admin Copilot.
-- The table intentionally keeps a compact, non-secret description of the operation only.

create table if not exists public.admin_copilot_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete restrict,
  action_type text not null check (action_type in ('create', 'update', 'delete')),
  entity_type text not null check (entity_type in (
    'destinations', 'packages', 'services', 'pricing_offers',
    'blog_categories', 'blog_posts', 'customer_reviews', 'site_settings'
  )),
  entity_id text,
  status text not null default 'executed' check (status in ('executed', 'failed')),
  summary text not null check (char_length(summary) between 1 and 600),
  change_summary jsonb not null default '{}'::jsonb,
  request_id uuid,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_copilot_audit_logs enable row level security;

create policy admin_copilot_audit_logs_select_admin
  on public.admin_copilot_audit_logs for select to authenticated
  using ((select private.is_admin()));

create policy admin_copilot_audit_logs_insert_admin
  on public.admin_copilot_audit_logs for insert to authenticated
  with check ((select private.is_admin()) and actor_id = (select auth.uid()));

-- Audit records are append-only from the application role. No update or delete policy is created.
create index if not exists admin_copilot_audit_logs_created_at_idx
  on public.admin_copilot_audit_logs (created_at desc);
create index if not exists admin_copilot_audit_logs_actor_created_at_idx
  on public.admin_copilot_audit_logs (actor_id, created_at desc);
create index if not exists admin_copilot_audit_logs_entity_idx
  on public.admin_copilot_audit_logs (entity_type, entity_id, created_at desc);

comment on table public.admin_copilot_audit_logs is
  'Append-only, admin-only audit trail for confirmed Amwaj Admin Copilot mutations; excludes credentials and file contents.';

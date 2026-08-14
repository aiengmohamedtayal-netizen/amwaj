begin;

create table if not exists public.notion_admin_operation_logs (
  id uuid primary key default gen_random_uuid(),
  notion_event_id text not null unique,
  notion_page_id text not null,
  data_source_id text not null,
  request_id uuid not null default gen_random_uuid(),
  entity_type text not null check (
    entity_type = any (array[
      'Package',
      'Destination',
      'Service',
      'Pricing Offer',
      'Blog Category',
      'Blog Post',
      'Review',
      'Setting',
      'Admin User'
    ])
  ),
  action_type text not null check (
    action_type = any (array[
      'Create',
      'Update',
      'Publish',
      'Archive',
      'Delete',
      'Invite Admin',
      'Disable Admin',
      'Reactivate Admin',
      'Sync'
    ])
  ),
  status text not null default 'processing' check (status = any (array['processing', 'completed', 'failed'])),
  external_id text,
  result_message text,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists notion_admin_operation_logs_page_created_idx
  on public.notion_admin_operation_logs (notion_page_id, created_at desc);

create index if not exists notion_admin_operation_logs_status_created_idx
  on public.notion_admin_operation_logs (status, created_at desc);

alter table public.notion_admin_operation_logs enable row level security;
revoke all on table public.notion_admin_operation_logs from anon, authenticated;

comment on table public.notion_admin_operation_logs is
  'Server-only idempotency and audit log for signed Notion Admin Center webhook operations.';

commit;

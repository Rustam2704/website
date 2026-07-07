-- LMS-lite fields for task/homework tracking.
-- Safe to run after supabase_schema.sql.

alter table public.progress_items
  add column if not exists due_at timestamptz,
  add column if not exists teacher_comment text,
  add column if not exists client_comment text;

create index if not exists progress_items_owner_due_idx on public.progress_items(owner_id, due_at)
where due_at is not null;

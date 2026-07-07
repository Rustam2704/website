-- Lesson/session fields needed for Calendar sync and clearer client portal lessons.
-- Safe to run after supabase_schema.sql.

alter table public.sessions
  add column if not exists meeting_url text,
  add column if not exists confirmation_status text not null default 'unconfirmed'
    check (confirmation_status in ('unconfirmed', 'confirmed', 'cancelled', 'completed'));

create index if not exists sessions_owner_confirmation_idx on public.sessions(owner_id, confirmation_status, date desc);

-- Lightweight billing/support fields for lesson balance tracking.
-- Safe to run after supabase_schema.sql.

alter table public.clients
  add column if not exists paid_sessions_total integer
    check (paid_sessions_total is null or paid_sessions_total >= 0),
  add column if not exists support_until timestamptz;

create index if not exists clients_owner_support_until_idx on public.clients(owner_id, support_until)
where support_until is not null;

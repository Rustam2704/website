-- Google Calendar groundwork for fanatic.space CRM.
-- Run this after supabase_schema.sql when calendar sync is ready.

create table if not exists public.calendar_connections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google'
    check (provider in ('google')),
  calendar_id text,
  calendar_name text not null default 'fanatic.space',
  sync_enabled boolean not null default false,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, provider)
);

alter table public.sessions
  add column if not exists google_calendar_event_id text,
  add column if not exists google_calendar_event_etag text,
  add column if not exists google_calendar_sync_status text not null default 'not_synced'
    check (google_calendar_sync_status in ('not_synced', 'pending', 'synced', 'failed')),
  add column if not exists google_calendar_synced_at timestamptz,
  add column if not exists google_calendar_error text;

drop trigger if exists calendar_connections_set_updated_at on public.calendar_connections;
create trigger calendar_connections_set_updated_at
before update on public.calendar_connections
for each row execute function public.set_updated_at();

alter table public.calendar_connections enable row level security;

drop policy if exists "owner can manage calendar connections" on public.calendar_connections;
create policy "owner can manage calendar connections"
on public.calendar_connections
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create index if not exists calendar_connections_owner_provider_idx on public.calendar_connections(owner_id, provider);
create index if not exists sessions_google_calendar_event_idx on public.sessions(owner_id, google_calendar_event_id);
create index if not exists sessions_google_calendar_sync_status_idx on public.sessions(owner_id, google_calendar_sync_status);

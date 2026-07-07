-- Supabase schema for fanatic.space CRM v0.
-- Version 0 is admin-only: Rustam tracks clients, sessions, progress, support notes, and files.
-- Client login can be added later without changing the core table shape.

create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  timezone text,
  plan text not null default 'session_only'
    check (plan in ('session_only', 'session_plus_support')),
  area text,
  current_goal text,
  status text not null default 'lead'
    check (status in ('lead', 'active', 'paused', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  date timestamptz not null default now(),
  duration_minutes integer not null default 50
    check (duration_minutes > 0 and duration_minutes <= 240),
  topic text,
  notes text,
  next_actions text,
  private_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  status text not null default 'in_progress'
    check (status in ('blocked', 'in_progress', 'improved', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  message text not null,
  source text not null default 'manual'
    check (source in ('email', 'form', 'manual', 'chat')),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  url text not null,
  label text,
  kind text not null default 'other'
    check (kind in ('screenshot', 'project', 'video', 'document', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intake_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  area text,
  goal text,
  source text not null default 'fanatic.space',
  status text not null default 'new'
    check (status in ('new', 'reviewed', 'converted', 'archived')),
  client_id uuid references public.clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

drop trigger if exists progress_items_set_updated_at on public.progress_items;
create trigger progress_items_set_updated_at
before update on public.progress_items
for each row execute function public.set_updated_at();

drop trigger if exists support_notes_set_updated_at on public.support_notes;
create trigger support_notes_set_updated_at
before update on public.support_notes
for each row execute function public.set_updated_at();

drop trigger if exists client_files_set_updated_at on public.client_files;
create trigger client_files_set_updated_at
before update on public.client_files
for each row execute function public.set_updated_at();

drop trigger if exists intake_requests_set_updated_at on public.intake_requests;
create trigger intake_requests_set_updated_at
before update on public.intake_requests
for each row execute function public.set_updated_at();

alter table public.clients enable row level security;
alter table public.sessions enable row level security;
alter table public.progress_items enable row level security;
alter table public.support_notes enable row level security;
alter table public.client_files enable row level security;
alter table public.intake_requests enable row level security;

drop policy if exists "owner can manage clients" on public.clients;
create policy "owner can manage clients"
on public.clients
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owner can manage sessions" on public.sessions;
create policy "owner can manage sessions"
on public.sessions
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owner can manage progress items" on public.progress_items;
create policy "owner can manage progress items"
on public.progress_items
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owner can manage support notes" on public.support_notes;
create policy "owner can manage support notes"
on public.support_notes
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owner can manage client files" on public.client_files;
create policy "owner can manage client files"
on public.client_files
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "anyone can create intake requests" on public.intake_requests;
create policy "anyone can create intake requests"
on public.intake_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "authenticated can manage intake requests" on public.intake_requests;
drop policy if exists "admin can manage intake requests" on public.intake_requests;
create policy "admin can manage intake requests"
on public.intake_requests
for all
to authenticated
using (lower(auth.jwt() ->> 'email') = 'direct@fanatic.space')
with check (lower(auth.jwt() ->> 'email') = 'direct@fanatic.space');

grant insert on public.intake_requests to anon;
grant select, insert, update, delete on public.intake_requests to authenticated;

create index if not exists clients_owner_status_idx on public.clients(owner_id, status);
create index if not exists clients_owner_email_idx on public.clients(owner_id, email);
create index if not exists sessions_client_date_idx on public.sessions(client_id, date desc);
create index if not exists progress_items_client_status_idx on public.progress_items(client_id, status);
create index if not exists support_notes_client_resolved_idx on public.support_notes(client_id, resolved);
create index if not exists client_files_client_created_idx on public.client_files(client_id, created_at desc);
create index if not exists intake_requests_status_created_idx on public.intake_requests(status, created_at desc);
create index if not exists intake_requests_email_idx on public.intake_requests(lower(email));

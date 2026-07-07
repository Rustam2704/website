-- Client portal preparation.
-- This does not enable every client-facing feature yet.
-- It creates a safe mapping between Supabase auth users and CRM clients.

create table if not exists public.client_access (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, user_id)
);

drop trigger if exists client_access_set_updated_at on public.client_access;
create trigger client_access_set_updated_at
before update on public.client_access
for each row execute function public.set_updated_at();

alter table public.client_access enable row level security;

drop policy if exists "owner can manage client access" on public.client_access;
create policy "owner can manage client access"
on public.client_access
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "client can read own access" on public.client_access;
create policy "client can read own access"
on public.client_access
for select
to authenticated
using (user_id = auth.uid() and status = 'active');

drop policy if exists "client can read assigned client profile" on public.clients;
create policy "client can read assigned client profile"
on public.clients
for select
to authenticated
using (
  exists (
    select 1
    from public.client_access access
    where access.client_id = clients.id
      and access.user_id = auth.uid()
      and access.status = 'active'
  )
);

drop policy if exists "client can read own progress items" on public.progress_items;
create policy "client can read own progress items"
on public.progress_items
for select
to authenticated
using (
  exists (
    select 1
    from public.client_access access
    where access.client_id = progress_items.client_id
      and access.user_id = auth.uid()
      and access.status = 'active'
  )
);

create index if not exists client_access_owner_idx on public.client_access(owner_id);
create index if not exists client_access_user_status_idx on public.client_access(user_id, status);
create index if not exists client_access_client_idx on public.client_access(client_id);

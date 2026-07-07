-- Client portal preparation.
-- This does not enable every client-facing feature yet.
-- It creates a safe mapping between Supabase auth users and CRM clients.

create table if not exists public.client_access (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
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

alter table public.client_access
add column if not exists user_email text;

create or replace function public.grant_client_access_by_email(
  p_client_id uuid,
  p_user_email text
)
returns public.client_access
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_owner_id uuid;
  v_user_id uuid;
  v_access public.client_access;
begin
  v_owner_id := auth.uid();

  if v_owner_id is null then
    raise exception 'Not authenticated';
  end if;

  select id
  into v_user_id
  from auth.users
  where lower(email) = lower(p_user_email)
  limit 1;

  if v_user_id is null then
    raise exception 'No Supabase auth user exists for %', p_user_email;
  end if;

  if not exists (
    select 1
    from public.clients
    where id = p_client_id
      and owner_id = v_owner_id
  ) then
    raise exception 'Client not found for current owner';
  end if;

  insert into public.client_access (owner_id, client_id, user_id, user_email, status)
  values (v_owner_id, p_client_id, v_user_id, lower(p_user_email), 'active')
  on conflict (client_id, user_id) do update
  set
    user_email = excluded.user_email,
    status = 'active',
    updated_at = now()
  returning * into v_access;

  return v_access;
end;
$$;

grant execute on function public.grant_client_access_by_email(uuid, text) to authenticated;

create or replace function public.client_update_progress_status(
  p_progress_id uuid,
  p_status text
)
returns public.progress_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_item public.progress_items;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_status not in ('blocked', 'in_progress', 'improved', 'done') then
    raise exception 'Invalid progress status';
  end if;

  update public.progress_items item
  set status = p_status
  where item.id = p_progress_id
    and exists (
      select 1
      from public.client_access access
      where access.client_id = item.client_id
        and access.user_id = v_user_id
        and access.status = 'active'
    )
  returning item.* into v_item;

  if v_item.id is null then
    raise exception 'Progress item not found for current client';
  end if;

  return v_item;
end;
$$;

grant execute on function public.client_update_progress_status(uuid, text) to authenticated;

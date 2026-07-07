-- LMS-lite fields for task/homework tracking.
-- Safe to run after supabase_schema.sql and supabase_client_portal.sql.

alter table public.progress_items
  add column if not exists due_at timestamptz,
  add column if not exists teacher_comment text,
  add column if not exists client_comment text;

create index if not exists progress_items_owner_due_idx on public.progress_items(owner_id, due_at)
where due_at is not null;

drop function if exists public.client_create_progress_item(text, text, text);

create or replace function public.client_create_progress_item(
  p_title text,
  p_status text default 'in_progress',
  p_priority text default 'normal',
  p_due_at timestamptz default null,
  p_client_comment text default null
)
returns public.progress_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_access public.client_access;
  v_item public.progress_items;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(p_title), '') is null then
    raise exception 'Progress title is required';
  end if;

  if p_status not in ('blocked', 'in_progress', 'improved', 'done') then
    raise exception 'Invalid progress status';
  end if;

  if p_priority not in ('low', 'normal', 'high') then
    raise exception 'Invalid progress priority';
  end if;

  select *
  into v_access
  from public.client_access access
  where access.user_id = v_user_id
    and access.status = 'active'
  order by access.created_at desc
  limit 1;

  if v_access.id is null then
    raise exception 'No active client access found';
  end if;

  insert into public.progress_items (owner_id, client_id, title, status, priority, due_at, client_comment)
  values (
    v_access.owner_id,
    v_access.client_id,
    trim(p_title),
    p_status,
    p_priority,
    p_due_at,
    nullif(trim(p_client_comment), '')
  )
  returning * into v_item;

  return v_item;
end;
$$;

grant execute on function public.client_create_progress_item(text, text, text, timestamptz, text) to authenticated;

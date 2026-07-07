-- Lesson/session fields needed for Calendar sync and clearer client portal lessons.
-- Safe to run after supabase_schema.sql.

alter table public.sessions
  add column if not exists meeting_url text,
  add column if not exists confirmation_status text not null default 'unconfirmed'
    check (confirmation_status in ('unconfirmed', 'confirmed', 'cancelled', 'completed'));

create index if not exists sessions_owner_confirmation_idx on public.sessions(owner_id, confirmation_status, date desc);

drop function if exists public.client_list_sessions();

create or replace function public.client_list_sessions()
returns table (
  id uuid,
  date timestamptz,
  duration_minutes integer,
  topic text,
  notes text,
  next_actions text,
  meeting_url text,
  confirmation_status text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    sessions.id,
    sessions.date,
    sessions.duration_minutes,
    sessions.topic,
    sessions.notes,
    sessions.next_actions,
    sessions.meeting_url,
    sessions.confirmation_status,
    sessions.created_at
  from public.sessions
  where exists (
    select 1
    from public.client_access access
    where access.client_id = sessions.client_id
      and access.user_id = auth.uid()
      and access.status = 'active'
  )
  order by sessions.date desc;
$$;

grant execute on function public.client_list_sessions() to authenticated;

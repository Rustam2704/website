param(
  [Parameter(Mandatory = $true)]
  [string]$ClientEmail,

  [string]$OwnerEmail = "direct@fanatic.space",

  [int]$Limit = 20
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString
$clientEmailSql = ConvertTo-SqlText $ClientEmail
$ownerEmailSql = ConvertTo-SqlText $OwnerEmail

$sql = @"
with owner as (
  select id as owner_id
  from auth.users
  where lower(email) = lower($ownerEmailSql)
  limit 1
),
client as (
  select c.*
  from public.clients c
  join owner o on o.owner_id = c.owner_id
  where lower(c.email) = lower($clientEmailSql)
  order by c.created_at desc
  limit 1
)
select 'PROFILE' as section, jsonb_pretty(to_jsonb(client)) as data
from client
union all
select 'PROGRESS', coalesce(jsonb_pretty(jsonb_agg(to_jsonb(p) order by p.updated_at desc)), '[]')
from (
  select title, status, priority, created_at, updated_at
  from public.progress_items
  where client_id = (select id from client)
  order by updated_at desc
  limit $Limit
) p
union all
select 'SESSIONS', coalesce(jsonb_pretty(jsonb_agg(to_jsonb(s) order by s.date desc)), '[]')
from (
  select date, duration_minutes, topic, notes, next_actions, private_notes, created_at
  from public.sessions
  where client_id = (select id from client)
  order by date desc
  limit $Limit
) s
union all
select 'SUPPORT', coalesce(jsonb_pretty(jsonb_agg(to_jsonb(n) order by n.created_at desc)), '[]')
from (
  select message, source, resolved, created_at, updated_at
  from public.support_notes
  where client_id = (select id from client)
  order by created_at desc
  limit $Limit
) n
union all
select 'FILES', coalesce(jsonb_pretty(jsonb_agg(to_jsonb(f) order by f.created_at desc)), '[]')
from (
  select kind, label, url, created_at
  from public.client_files
  where client_id = (select id from client)
  order by created_at desc
  limit $Limit
) f
union all
select 'ACCESS', coalesce(jsonb_pretty(jsonb_agg(to_jsonb(a) order by a.created_at desc)), '[]')
from (
  select user_email, status, created_at, updated_at
  from public.client_access
  where client_id = (select id from client)
  order by created_at desc
  limit $Limit
) a;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql


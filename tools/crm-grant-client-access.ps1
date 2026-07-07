param(
  [Parameter(Mandatory = $true)]
  [string]$ClientEmail,

  [Parameter(Mandatory = $true)]
  [string]$UserEmail,

  [string]$OwnerEmail = "direct@fanatic.space"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString

$sql = @"
with owner as (
  select id as owner_id
  from auth.users
  where lower(email) = lower($(ConvertTo-SqlText $OwnerEmail))
  limit 1
),
client as (
  select c.id as client_id, c.owner_id
  from public.clients c
  join owner o on o.owner_id = c.owner_id
  where lower(c.email) = lower($(ConvertTo-SqlText $ClientEmail))
  order by c.created_at desc
  limit 1
),
portal_user as (
  select id as user_id
  from auth.users
  where lower(email) = lower($(ConvertTo-SqlText $UserEmail))
  limit 1
),
updated_access as (
  update public.client_access access
  set
    user_id = coalesce((select user_id from portal_user), access.user_id),
    user_email = lower($(ConvertTo-SqlText $UserEmail)),
    status = 'active',
    updated_at = now()
  where access.client_id = (select client_id from client)
    and lower(access.user_email) = lower($(ConvertTo-SqlText $UserEmail))
  returning id, client_id, user_id, user_email, status, created_at
),
inserted_access as (
  insert into public.client_access (owner_id, client_id, user_id, user_email, status)
  select
    client.owner_id,
    client.client_id,
    (select user_id from portal_user),
    lower($(ConvertTo-SqlText $UserEmail)),
    'active'
  from client
  where not exists (select 1 from updated_access)
    and not exists (
      select 1
      from public.client_access access
      where access.client_id = client.client_id
        and access.user_id = (select user_id from portal_user)
        and (select user_id from portal_user) is not null
    )
  on conflict (client_id, user_id) do update
  set
    user_email = excluded.user_email,
    status = 'active',
    updated_at = now()
  returning id, client_id, user_id, user_email, status, created_at
)
select * from updated_access
union all
select * from inserted_access;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

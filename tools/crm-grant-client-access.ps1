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
  where email = $(ConvertTo-SqlText $OwnerEmail)
  limit 1
),
client as (
  select c.id as client_id, c.owner_id
  from public.clients c
  join owner o on o.owner_id = c.owner_id
  where c.email = $(ConvertTo-SqlText $ClientEmail)
  order by c.created_at desc
  limit 1
),
portal_user as (
  select id as user_id
  from auth.users
  where email = $(ConvertTo-SqlText $UserEmail)
  limit 1
)
insert into public.client_access (owner_id, client_id, user_id, status)
select client.owner_id, client.client_id, portal_user.user_id, 'active'
from client, portal_user
on conflict (client_id, user_id) do update
set status = 'active'
returning id, client_id, user_id, status, created_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

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
  select c.id as client_id
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
)
update public.client_access access
set
  status = 'revoked',
  updated_at = now()
from client, portal_user
where access.client_id = client.client_id
  and access.user_id = portal_user.user_id
returning access.id, access.client_id, access.user_id, access.user_email, access.status, access.updated_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql


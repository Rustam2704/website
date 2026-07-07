param(
  [Parameter(Mandatory = $true)]
  [string]$ClientEmail,

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
target_client as (
  select c.id
  from public.clients c
  join owner o on o.owner_id = c.owner_id
  where c.email = $(ConvertTo-SqlText $ClientEmail)
)
delete from public.clients
where id in (select id from target_client)
returning id, name, email, status, created_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

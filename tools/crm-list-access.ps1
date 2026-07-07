param(
  [string]$OwnerEmail = "direct@fanatic.space",
  [string]$ClientEmail = "",
  [int]$Limit = 50
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString
$clientFilter = if ([string]::IsNullOrWhiteSpace($ClientEmail)) {
  "true"
} else {
  "lower(c.email) = lower($(ConvertTo-SqlText $ClientEmail))"
}

$sql = @"
with owner as (
  select id as owner_id
  from auth.users
  where lower(email) = lower($(ConvertTo-SqlText $OwnerEmail))
  limit 1
)
select
  c.name as client_name,
  c.email as client_email,
  access.user_email as portal_user_email,
  auth_user.email as auth_email,
  access.status,
  access.created_at,
  access.updated_at
from public.client_access access
join public.clients c on c.id = access.client_id
join owner o on o.owner_id = access.owner_id
left join auth.users auth_user on auth_user.id = access.user_id
where $clientFilter
order by access.updated_at desc, access.created_at desc
limit $Limit;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql


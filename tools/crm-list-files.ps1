param(
  [string]$ClientEmail = "",
  [string]$OwnerEmail = "direct@fanatic.space",
  [int]$Limit = 20
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
  f.id,
  c.name as client_name,
  c.email as client_email,
  f.kind,
  f.label,
  f.url,
  f.created_at
from public.client_files f
join public.clients c on c.id = f.client_id
join owner o on o.owner_id = f.owner_id
where $clientFilter
order by f.created_at desc
limit $Limit;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

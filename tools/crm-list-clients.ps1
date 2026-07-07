param(
  [string]$OwnerEmail = "direct@fanatic.space",
  [int]$Limit = 20
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString

$sql = @"
select
  c.id,
  c.name,
  c.email,
  c.status,
  c.plan,
  c.created_at
from public.clients c
join auth.users u on u.id = c.owner_id
where u.email = '$OwnerEmail'
order by c.created_at desc
limit $Limit;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

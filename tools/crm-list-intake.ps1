param(
  [ValidateSet("all", "new", "reviewed", "converted", "archived")]
  [string]$Status = "all",
  [int]$Limit = 20
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString
$where = if ($Status -eq "all") { "true" } else { "status = $(ConvertTo-SqlText $Status)" }

$sql = @"
select
  id,
  name,
  email,
  status,
  area,
  left(goal, 100) as goal_preview,
  created_at
from public.intake_requests
where $where
order by created_at desc
limit $Limit;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

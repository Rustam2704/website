param(
  [Parameter(Mandatory = $true)]
  [string]$ClientEmail,

  [ValidateSet("lead", "active", "paused", "done")]
  [string]$Status,

  [ValidateSet("session_only", "session_plus_support")]
  [string]$Plan,

  [string]$Area,
  [string]$CurrentGoal,
  [string]$Timezone,
  [string]$OwnerEmail = "direct@fanatic.space"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$updates = @()
if ($PSBoundParameters.ContainsKey("Status")) { $updates += "status = '$Status'" }
if ($PSBoundParameters.ContainsKey("Plan")) { $updates += "plan = '$Plan'" }
if ($PSBoundParameters.ContainsKey("Area")) { $updates += "area = $(ConvertTo-SqlText $Area)" }
if ($PSBoundParameters.ContainsKey("CurrentGoal")) { $updates += "current_goal = $(ConvertTo-SqlText $CurrentGoal)" }
if ($PSBoundParameters.ContainsKey("Timezone")) { $updates += "timezone = $(ConvertTo-SqlText $Timezone)" }

if (-not $updates.Count) {
  throw "No updates provided."
}

$connection = Get-CrmConnectionString
$setClause = $updates -join ", "

$sql = @"
with owner as (
  select id as owner_id
  from auth.users
  where email = $(ConvertTo-SqlText $OwnerEmail)
  limit 1
)
update public.clients
set $setClause
where email = $(ConvertTo-SqlText $ClientEmail)
  and owner_id = (select owner_id from owner)
returning id, name, email, status, plan, area, current_goal, updated_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

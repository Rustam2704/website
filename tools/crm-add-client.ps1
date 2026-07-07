param(
  [Parameter(Mandatory = $true)]
  [string]$Name,

  [string]$Email = "",
  [string]$Timezone = "",
  [ValidateSet("session_only", "session_plus_support")]
  [string]$Plan = "session_only",
  [string]$Area = "",
  [string]$CurrentGoal = "",
  [ValidateSet("lead", "active", "paused", "done")]
  [string]$Status = "lead",
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
)
insert into public.clients (
  owner_id,
  name,
  email,
  timezone,
  plan,
  area,
  current_goal,
  status
)
select
  owner_id,
  $(ConvertTo-SqlText $Name),
  $(ConvertTo-SqlText $Email),
  $(ConvertTo-SqlText $Timezone),
  '$Plan',
  $(ConvertTo-SqlText $Area),
  $(ConvertTo-SqlText $CurrentGoal),
  '$Status'
from owner
returning id, name, email, status, plan, created_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

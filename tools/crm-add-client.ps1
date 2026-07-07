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

if (-not $env:PGPASSWORD) {
  throw "Set `$env:PGPASSWORD to the Supabase database password before running this script."
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  $fallback = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
  if (Test-Path $fallback) {
    $psql = @{ Source = $fallback }
  } else {
    throw "psql was not found. Install PostgreSQL client tools first."
  }
}

function SqlText([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return "null"
  }

  return "'" + $Value.Replace("'", "''") + "'"
}

$connection = "host=aws-0-eu-west-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.iavkvtkoowwkvizjpasy sslmode=require"

$sql = @"
with owner as (
  select id as owner_id
  from auth.users
  where email = $(SqlText $OwnerEmail)
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
  $(SqlText $Name),
  $(SqlText $Email),
  $(SqlText $Timezone),
  '$Plan',
  $(SqlText $Area),
  $(SqlText $CurrentGoal),
  '$Status'
from owner
returning id, name, email, status, plan, created_at;
"@

& $psql.Source $connection -c $sql

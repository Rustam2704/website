param(
  [Parameter(Mandatory = $true)]
  [string]$CsvPath,

  [string]$OwnerEmail = "direct@fanatic.space",

  [switch]$UpdateExisting
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

if (-not (Test-Path -LiteralPath $CsvPath)) {
  throw "CSV file was not found: $CsvPath"
}

$validPlans = @("session_only", "session_plus_support")
$validStatuses = @("lead", "active", "paused", "done")
$rows = @(Import-Csv -LiteralPath $CsvPath)

if (-not $rows.Count) {
  throw "CSV file has no data rows."
}

$connection = Get-CrmConnectionString
$imported = 0
$skipped = 0

foreach ($row in $rows) {
  $name = "$($row.name)".Trim()
  $email = "$($row.email)".Trim()
  $timezone = "$($row.timezone)".Trim()
  $plan = "$($row.plan)".Trim()
  $area = "$($row.area)".Trim()
  $currentGoal = "$($row.current_goal)".Trim()
  $status = "$($row.status)".Trim()

  if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($email)) {
    Write-Warning "Skipping row without name or email."
    $skipped += 1
    continue
  }

  if ([string]::IsNullOrWhiteSpace($plan)) { $plan = "session_only" }
  if ([string]::IsNullOrWhiteSpace($status)) { $status = "lead" }

  if ($validPlans -notcontains $plan) {
    throw "Invalid plan '$plan' for $email. Use: $($validPlans -join ', ')."
  }

  if ($validStatuses -notcontains $status) {
    throw "Invalid status '$status' for $email. Use: $($validStatuses -join ', ')."
  }

  $existingUpdate = if ($UpdateExisting) {
    @"
updated as (
  update public.clients c
  set
    name = $(ConvertTo-SqlText $name),
    timezone = $(ConvertTo-SqlText $timezone),
    plan = '$plan',
    area = $(ConvertTo-SqlText $area),
    current_goal = $(ConvertTo-SqlText $currentGoal),
    status = '$status'
  from owner o
  where c.owner_id = o.owner_id
    and lower(c.email) = lower($(ConvertTo-SqlText $email))
  returning 'updated' as action, c.id, c.name, c.email, c.status, c.plan
),
"@
  } else {
    @"
updated as (
  select
    'skipped_existing'::text as action,
    c.id,
    c.name,
    c.email,
    c.status,
    c.plan
  from public.clients c
  join owner o on o.owner_id = c.owner_id
  where lower(c.email) = lower($(ConvertTo-SqlText $email))
  limit 1
),
"@
  }

  $sql = @"
with owner as (
  select id as owner_id
  from auth.users
  where lower(email) = lower($(ConvertTo-SqlText $OwnerEmail))
  limit 1
),
$existingUpdate
inserted as (
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
    $(ConvertTo-SqlText $name),
    $(ConvertTo-SqlText $email),
    $(ConvertTo-SqlText $timezone),
    '$plan',
    $(ConvertTo-SqlText $area),
    $(ConvertTo-SqlText $currentGoal),
    '$status'
  from owner
  where not exists (select 1 from updated)
  returning 'inserted' as action, id, name, email, status, plan
)
select * from inserted
union all
select * from updated;
"@

  Invoke-CrmPsql -ConnectionString $connection -Sql $sql
  $imported += 1
}

Write-Output "Processed $imported CSV rows. Skipped $skipped invalid rows."

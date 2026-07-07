param(
  [Parameter(Mandatory = $true)]
  [ValidateSet(
    "supabase_schema.sql",
    "supabase_storage.sql",
    "supabase_client_portal.sql",
    "supabase_lesson_fields.sql",
    "supabase_lms_fields.sql",
    "supabase_calendar.sql"
  )]
  [string]$File
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$migrationPath = Join-Path $projectRoot $File

if (-not (Test-Path $migrationPath)) {
  throw "Migration file not found: $migrationPath"
}

$connection = Get-CrmConnectionString
$psql = Get-CrmPsql

& $psql $connection -v ON_ERROR_STOP=1 -f $migrationPath

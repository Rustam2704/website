param(
  [string]$OutputDir = "exports"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString
$psql = Get-CrmPsql
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$target = Join-Path $OutputDir "crm-$timestamp"
New-Item -ItemType Directory -Force -Path $target | Out-Null

$tables = @(
  "clients",
  "sessions",
  "progress_items",
  "support_notes",
  "client_files",
  "client_access",
  "intake_requests"
)

foreach ($table in $tables) {
  $file = Join-Path $target "$table.csv"
  $sql = "\copy (select * from public.$table order by created_at desc) to '$($file.Replace('\', '/'))' with csv header"
  & $psql $connection -c $sql
}

Write-Output "Exported CRM tables to $target"

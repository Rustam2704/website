param(
  [string]$OutputDir = "exports"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

if (-not $env:PGPASSWORD) {
  throw "Set `$env:PGPASSWORD to the Supabase database password before running this script."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $OutputDir "backup-$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$summaryFile = Join-Path $backupDir "summary.txt"
$manifestFile = Join-Path $backupDir "manifest.txt"

& "$PSScriptRoot\crm-summary.ps1" | Tee-Object -FilePath $summaryFile
& "$PSScriptRoot\crm-export.ps1" -OutputDir $backupDir
& "$PSScriptRoot\crm-dump-db.ps1" -OutputDir $backupDir

$manifest = @(
  "fanatic-crm backup",
  "created_at=$((Get-Date).ToString("s"))",
  "project_url=https://iavkvtkoowwkvizjpasy.supabase.co",
  "contents=summary, csv tables, public schema sql dump",
  "restore_note=Use the SQL dump for PostgreSQL/Supabase migration; use CSV files for spreadsheet inspection."
)

Set-Content -LiteralPath $manifestFile -Value $manifest
Write-Output "Backup written to $backupDir"


param(
  [string]$OutputDir = "exports"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

if (-not $env:PGPASSWORD) {
  throw "Set `$env:PGPASSWORD to the Supabase database password before running this script."
}

$pgDump = Get-CrmPgDump
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$target = Join-Path $OutputDir "fanatic-crm-db-$timestamp.sql"

& $pgDump `
  --host "aws-0-eu-west-1.pooler.supabase.com" `
  --port "6543" `
  --username "postgres.iavkvtkoowwkvizjpasy" `
  --dbname "postgres" `
  --schema "public" `
  --no-owner `
  --no-privileges `
  --file $target

Write-Output "Dumped public schema and data to $target"

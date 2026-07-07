param(
  [switch]$ConfirmDelete
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

if (-not $ConfirmDelete) {
  throw "This deletes known Codex test CRM records. Re-run with -ConfirmDelete to proceed."
}

$connection = Get-CrmConnectionString
$sql = @"
delete from public.clients
where email in (
  'codex-test@example.com',
  'cli-test@example.com',
  'form-lead-test@example.com'
)
returning id, name, email;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

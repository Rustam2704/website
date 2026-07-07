param(
  [Parameter(Mandatory = $true)]
  [string]$RequestId
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString
$sql = @"
update public.intake_requests
set status = 'archived'
where id = $(ConvertTo-SqlText $RequestId)
returning id, name, email, status, updated_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

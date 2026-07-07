param(
  [int]$Limit = 20
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString
$sql = @"
select
  id,
  email,
  created_at,
  last_sign_in_at
from auth.users
order by created_at desc
limit $Limit;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

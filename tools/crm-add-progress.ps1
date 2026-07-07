param(
  [Parameter(Mandatory = $true)]
  [string]$ClientEmail,

  [Parameter(Mandatory = $true)]
  [string]$Title,

  [ValidateSet("blocked", "in_progress", "improved", "done")]
  [string]$Status = "in_progress",

  [ValidateSet("low", "normal", "high")]
  [string]$Priority = "normal",

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
),
client as (
  select c.id as client_id, c.owner_id
  from public.clients c
  join owner o on o.owner_id = c.owner_id
  where c.email = $(ConvertTo-SqlText $ClientEmail)
  order by c.created_at desc
  limit 1
)
insert into public.progress_items (owner_id, client_id, title, status, priority)
select owner_id, client_id, $(ConvertTo-SqlText $Title), '$Status', '$Priority'
from client
returning id, client_id, title, status, priority, created_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

param(
  [Parameter(Mandatory = $true)]
  [string]$ClientEmail,

  [Parameter(Mandatory = $true)]
  [string]$Url,

  [string]$Label = "",

  [ValidateSet("screenshot", "project", "video", "document", "other")]
  [string]$Kind = "other",

  [string]$OwnerEmail = "direct@fanatic.space"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

if ($Url -notmatch "^https?://") {
  throw "Only http and https URLs are allowed."
}

$connection = Get-CrmConnectionString
$sql = @"
with owner as (
  select id as owner_id
  from auth.users
  where lower(email) = lower($(ConvertTo-SqlText $OwnerEmail))
  limit 1
),
client as (
  select c.id as client_id, c.owner_id
  from public.clients c
  join owner o on o.owner_id = c.owner_id
  where lower(c.email) = lower($(ConvertTo-SqlText $ClientEmail))
  order by c.created_at desc
  limit 1
)
insert into public.client_files (owner_id, client_id, url, label, kind)
select owner_id, client_id, $(ConvertTo-SqlText $Url), $(ConvertTo-SqlText $Label), '$Kind'
from client
returning id, client_id, label, kind, url, created_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

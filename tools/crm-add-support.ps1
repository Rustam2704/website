param(
  [Parameter(Mandatory = $true)]
  [string]$ClientEmail,

  [Parameter(Mandatory = $true)]
  [string]$Message,

  [ValidateSet("email", "form", "manual", "chat")]
  [string]$Source = "manual",

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
insert into public.support_notes (owner_id, client_id, message, source)
select owner_id, client_id, $(ConvertTo-SqlText $Message), '$Source'
from client
returning id, client_id, source, message, created_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

param(
  [Parameter(Mandatory = $true)]
  [string]$ClientEmail,

  [switch]$All,
  [string]$OwnerEmail = "direct@fanatic.space"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString
$limitClause = if ($All) { "" } else { "limit 1" }

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
),
target_notes as (
  select n.id
  from public.support_notes n
  join client c on c.client_id = n.client_id and c.owner_id = n.owner_id
  where n.resolved = false
  order by n.created_at desc
  $limitClause
)
update public.support_notes
set resolved = true
where id in (select id from target_notes)
returning id, client_id, message, resolved, updated_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

param(
  [Parameter(Mandatory = $true)]
  [string]$ClientEmail,

  [string]$Topic = "",
  [string]$Notes = "",
  [string]$NextActions = "",
  [int]$DurationMinutes = 50,
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
insert into public.sessions (
  owner_id,
  client_id,
  date,
  duration_minutes,
  topic,
  notes,
  next_actions
)
select
  owner_id,
  client_id,
  now(),
  $DurationMinutes,
  $(ConvertTo-SqlText $Topic),
  $(ConvertTo-SqlText $Notes),
  $(ConvertTo-SqlText $NextActions)
from client
returning id, client_id, topic, duration_minutes, created_at;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

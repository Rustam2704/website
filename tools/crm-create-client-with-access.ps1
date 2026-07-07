param(
  [Parameter(Mandatory = $true)]
  [string]$Name,

  [Parameter(Mandatory = $true)]
  [string]$Email,

  [string]$UserEmail = "",
  [string]$Timezone = "",
  [ValidateSet("session_only", "session_plus_support")]
  [string]$Plan = "session_only",
  [string]$Area = "",
  [string]$CurrentGoal = "",
  [ValidateSet("lead", "active", "paused", "done")]
  [string]$Status = "lead",
  [string]$OwnerEmail = "direct@fanatic.space"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

if ([string]::IsNullOrWhiteSpace($UserEmail)) {
  $UserEmail = $Email
}

$connection = Get-CrmConnectionString
$sql = @"
with owner as (
  select id as owner_id
  from auth.users
  where lower(email) = lower($(ConvertTo-SqlText $OwnerEmail))
  limit 1
),
existing_client as (
  select c.id, c.owner_id, c.name, c.email, c.status, c.plan
  from public.clients c
  join owner o on o.owner_id = c.owner_id
  where lower(c.email) = lower($(ConvertTo-SqlText $Email))
  order by c.created_at desc
  limit 1
),
created_client as (
  insert into public.clients (
    owner_id,
    name,
    email,
    timezone,
    plan,
    area,
    current_goal,
    status
  )
  select
    owner_id,
    $(ConvertTo-SqlText $Name),
    $(ConvertTo-SqlText $Email),
    $(ConvertTo-SqlText $Timezone),
    '$Plan',
    $(ConvertTo-SqlText $Area),
    $(ConvertTo-SqlText $CurrentGoal),
    '$Status'
  from owner
  where not exists (select 1 from existing_client)
  returning id, owner_id, name, email, status, plan
),
selected_client as (
  select id, owner_id, name, email, status, plan from created_client
  union all
  select id, owner_id, name, email, status, plan from existing_client
),
portal_user as (
  select id as user_id
  from auth.users
  where lower(email) = lower($(ConvertTo-SqlText $UserEmail))
  limit 1
),
granted as (
  insert into public.client_access (owner_id, client_id, user_id, user_email, status)
  select
    selected_client.owner_id,
    selected_client.id,
    portal_user.user_id,
    lower($(ConvertTo-SqlText $UserEmail)),
    'active'
  from selected_client, portal_user
  on conflict (client_id, user_id) do update
  set
    user_email = excluded.user_email,
    status = 'active',
    updated_at = now()
  returning id, client_id, user_email, status
)
select
  selected_client.id as client_id,
  selected_client.name,
  selected_client.email,
  selected_client.status,
  selected_client.plan,
  case
    when exists (select 1 from granted) then 'granted'
    when exists (select 1 from portal_user) then 'not_granted'
    else 'auth_user_missing'
  end as portal_access
from selected_client;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql


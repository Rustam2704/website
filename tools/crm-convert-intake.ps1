param(
  [Parameter(Mandatory = $true)]
  [string]$RequestId,

  [string]$OwnerEmail = "direct@fanatic.space",

  [ValidateSet("session_only", "session_plus_support")]
  [string]$Plan = "session_only"
)

$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString
$sql = @"
with owner as (
  select id as owner_id
  from auth.users
  where lower(email) = lower($(ConvertTo-SqlText $OwnerEmail))
  limit 1
),
request as (
  select *
  from public.intake_requests
  where id = $(ConvertTo-SqlText $RequestId)
  limit 1
),
existing_client as (
  select c.id, c.name, c.email, c.status, c.plan
  from public.clients c
  join owner on owner.owner_id = c.owner_id
  join request on lower(c.email) = lower(request.email)
  limit 1
),
created_client as (
  insert into public.clients (owner_id, name, email, area, current_goal, status, plan)
  select owner.owner_id, request.name, request.email, request.area, request.goal, 'lead', $(ConvertTo-SqlText $Plan)
  from owner, request
  where not exists (select 1 from existing_client)
  returning id, name, email, status, plan
),
selected_client as (
  select id, name, email, status, plan from created_client
  union all
  select id, name, email, status, plan from existing_client
),
updated_request as (
  update public.intake_requests
  set status = 'converted',
      client_id = (select id from selected_client limit 1)
  where id = (select id from request)
  returning id as request_id, status as request_status
)
select
  selected_client.id as client_id,
  selected_client.name,
  selected_client.email,
  selected_client.status,
  selected_client.plan,
  updated_request.request_id,
  updated_request.request_status
from selected_client, updated_request;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

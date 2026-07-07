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
created_client as (
  insert into public.clients (owner_id, name, email, area, current_goal, status, plan)
  select owner.owner_id, request.name, request.email, request.area, request.goal, 'lead', $(ConvertTo-SqlText $Plan)
  from owner, request
  returning id, name, email, status, plan
),
updated_request as (
  update public.intake_requests
  set status = 'converted',
      client_id = (select id from created_client)
  where id = (select id from request)
  returning id as request_id, status as request_status
)
select
  created_client.id as client_id,
  created_client.name,
  created_client.email,
  created_client.status,
  created_client.plan,
  updated_request.request_id,
  updated_request.request_status
from created_client, updated_request;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

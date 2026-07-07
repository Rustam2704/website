$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString

$sql = @"
with checks as (
  select
    'duplicate client emails' as check_name,
    count(*)::text as value,
    count(*) = 0 as ok
  from (
    select lower(email)
    from public.clients
    where nullif(trim(email), '') is not null
    group by lower(email)
    having count(*) > 1
  ) duplicates
  union all
  select
    'converted intake without client',
    count(*)::text,
    count(*) = 0
  from public.intake_requests
  where status = 'converted'
    and client_id is null
  union all
  select
    'client access without user email',
    count(*)::text,
    count(*) = 0
  from public.client_access
  where nullif(trim(user_email), '') is null
  union all
  select
    'client access without auth user',
    count(*)::text,
    count(*) = 0
  from public.client_access access
  left join auth.users users on users.id = access.user_id
  where users.id is null
  union all
  select
    'invalid client file urls',
    count(*)::text,
    count(*) = 0
  from public.client_files
  where url !~* '^(https?://|storage://client-files/)'
  union all
  select
    'open support notes',
    count(*)::text,
    true
  from public.support_notes
  where resolved = false
  union all
  select
    'new intake requests',
    count(*)::text,
    true
  from public.intake_requests
  where status = 'new'
)
select *
from checks
order by
  case when ok then 1 else 0 end,
  check_name;
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

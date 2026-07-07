param(
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
)
select 'clients_total' as metric, count(*)::text as value
from public.clients c, owner o
where c.owner_id = o.owner_id
union all
select 'clients_active', count(*)::text
from public.clients c, owner o
where c.owner_id = o.owner_id and c.status = 'active'
union all
select 'leads', count(*)::text
from public.clients c, owner o
where c.owner_id = o.owner_id and c.status = 'lead'
union all
select 'blocked_progress', count(*)::text
from public.progress_items p, owner o
where p.owner_id = o.owner_id and p.status = 'blocked'
union all
select 'open_support', count(*)::text
from public.support_notes n, owner o
where n.owner_id = o.owner_id and n.resolved = false
union all
select 'files', count(*)::text
from public.client_files f, owner o
where f.owner_id = o.owner_id
union all
select 'new_intake_requests', count(*)::text
from public.intake_requests
where status = 'new';
"@

Invoke-CrmPsql -ConnectionString $connection -Sql $sql

Write-Output ""
Write-Output "Recent clients:"
& "$PSScriptRoot\crm-list-clients.ps1" -OwnerEmail $OwnerEmail -Limit 5

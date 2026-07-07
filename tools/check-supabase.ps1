$ErrorActionPreference = "Stop"
. "$PSScriptRoot\crm-lib.ps1"

$connection = Get-CrmConnectionString
$psql = Get-CrmPsql

$sql = @"
select 'table:clients' as check, exists(select 1 from information_schema.tables where table_schema='public' and table_name='clients') as ok
union all
select 'table:sessions', exists(select 1 from information_schema.tables where table_schema='public' and table_name='sessions')
union all
select 'table:progress_items', exists(select 1 from information_schema.tables where table_schema='public' and table_name='progress_items')
union all
select 'table:support_notes', exists(select 1 from information_schema.tables where table_schema='public' and table_name='support_notes')
union all
select 'table:client_files', exists(select 1 from information_schema.tables where table_schema='public' and table_name='client_files')
union all
select 'table:client_access', exists(select 1 from information_schema.tables where table_schema='public' and table_name='client_access')
union all
select 'bucket:client-files', exists(select 1 from storage.buckets where id='client-files')
union all
select 'rpc:grant_client_access_by_email', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='grant_client_access_by_email')
union all
select 'rpc:client_update_progress_status', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='client_update_progress_status');
"@

& $psql $connection -c $sql

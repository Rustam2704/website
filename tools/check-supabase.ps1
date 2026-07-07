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
select 'table:intake_requests', exists(select 1 from information_schema.tables where table_schema='public' and table_name='intake_requests')
union all
select 'table:client_access', exists(select 1 from information_schema.tables where table_schema='public' and table_name='client_access')
union all
select 'bucket:client-files', exists(select 1 from storage.buckets where id='client-files')
union all
select 'policy:client storage read', exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='client can read assigned storage files')
union all
select 'rpc:grant_client_access_by_email', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='grant_client_access_by_email')
union all
select 'rpc:claim_client_access_by_email', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='claim_client_access_by_email')
union all
select 'client_access:user_id nullable', exists(
  select 1
  from information_schema.columns
  where table_schema='public'
    and table_name='client_access'
    and column_name='user_id'
    and is_nullable='YES'
)
union all
select 'rpc:client_update_progress_status', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='client_update_progress_status')
union all
select 'rpc:client_update_progress_note', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='client_update_progress_note')
union all
select 'rpc:client_create_progress_item', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='client_create_progress_item')
union all
select 'rpc:client_create_support_note', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='client_create_support_note')
union all
select 'rpc:client_create_file_link', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='client_create_file_link')
union all
select 'rpc:client_list_sessions', exists(select 1 from information_schema.routines where routine_schema='public' and routine_name='client_list_sessions')
union all
select 'column:sessions.meeting_url', exists(select 1 from information_schema.columns where table_schema='public' and table_name='sessions' and column_name='meeting_url')
union all
select 'column:sessions.confirmation_status', exists(select 1 from information_schema.columns where table_schema='public' and table_name='sessions' and column_name='confirmation_status')
union all
select 'column:progress_items.due_at', exists(select 1 from information_schema.columns where table_schema='public' and table_name='progress_items' and column_name='due_at')
union all
select 'column:progress_items.teacher_comment', exists(select 1 from information_schema.columns where table_schema='public' and table_name='progress_items' and column_name='teacher_comment')
union all
select 'column:progress_items.client_comment', exists(select 1 from information_schema.columns where table_schema='public' and table_name='progress_items' and column_name='client_comment')
union all
select 'column:clients.paid_sessions_total', exists(select 1 from information_schema.columns where table_schema='public' and table_name='clients' and column_name='paid_sessions_total')
union all
select 'column:clients.support_until', exists(select 1 from information_schema.columns where table_schema='public' and table_name='clients' and column_name='support_until')
union all
select 'table:calendar_connections', exists(select 1 from information_schema.tables where table_schema='public' and table_name='calendar_connections')
union all
select 'column:sessions.google_calendar_event_id', exists(select 1 from information_schema.columns where table_schema='public' and table_name='sessions' and column_name='google_calendar_event_id');
"@

& $psql $connection -c $sql

# Database Access

Supabase project:

```text
fanatic-crm
```

Project URL:

```text
https://iavkvtkoowwkvizjpasy.supabase.co
```

## psql

`psql` is installed on this machine:

```text
C:\Program Files\PostgreSQL\17\bin\psql.exe
```

The user PATH has been updated so new terminals should be able to run:

```powershell
psql --version
```

Supabase pooler connection:

```text
host=aws-0-eu-west-1.pooler.supabase.com
port=6543
dbname=postgres
user=postgres.iavkvtkoowwkvizjpasy
sslmode=require
```

Use it like this:

```powershell
$env:PGPASSWORD = "<database-password>"
psql "host=aws-0-eu-west-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.iavkvtkoowwkvizjpasy sslmode=require"
```

Do not commit the database password.

## Smoke Test

Show the current CRM users:

```sql
select id, email, created_at
from auth.users
order by created_at desc;
```

Show recent clients:

```sql
select id, name, email, status, plan, created_at
from public.clients
order by created_at desc
limit 10;
```

Show storage buckets:

```sql
select id, name, public, file_size_limit
from storage.buckets;
```

## Helper Scripts

List clients:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-list-clients.ps1
```

Add a client:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-add-client.ps1 `
  -Name "Client Name" `
  -Email "client@example.com" `
  -Area "AI / programming" `
  -CurrentGoal "First goal"
```

Add a lead from a FormSubmit email:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-add-lead-from-form.ps1 `
  -Name "Lead Name" `
  -Email "lead@example.com" `
  -Area "teaching/mentorship" `
  -Goal "What they wrote in the form"
```

Add progress:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-add-progress.ps1 `
  -ClientEmail "client@example.com" `
  -Title "First progress item" `
  -Status "in_progress" `
  -Priority "normal"
```

Add a session:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-add-session.ps1 `
  -ClientEmail "client@example.com" `
  -Topic "Session topic" `
  -Notes "Session notes" `
  -NextActions "Next actions" `
  -PrivateNotes "Private admin-only notes"
```

Add a support note:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-add-support.ps1 `
  -ClientEmail "client@example.com" `
  -Message "Support note text"
```

Resolve latest support note for a client:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-resolve-support.ps1 -ClientEmail "client@example.com"
```

Resolve all open support notes for a client:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-resolve-support.ps1 -ClientEmail "client@example.com" -All
```

Grant portal access after a client auth user exists:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-grant-client-access.ps1 `
  -ClientEmail "client@example.com" `
  -UserEmail "client@example.com"
```

Delete a client and related records:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-delete-client.ps1 -ClientEmail "client@example.com"
```

Update client status / plan / fields:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-update-client.ps1 `
  -ClientEmail "client@example.com" `
  -Status "active" `
  -Plan "session_plus_support"
```

Export CRM tables to CSV:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-export.ps1
```

Check Supabase infrastructure:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\check-supabase.ps1
```

Show CRM summary:

```powershell
$env:PGPASSWORD = "<database-password>"
.\tools\crm-summary.ps1
```

Exports are written to:

```text
exports/crm-YYYYMMDD-HHMMSS/
```

Current test data:

- `Codex Test Client`
- one progress item
- one session
- one support note
- `CLI Test Client`
- one progress item
- one session
- one support note

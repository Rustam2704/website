# Migration Order

Use this file when applying database changes in Supabase SQL Editor or through `psql`.

## Current Live Project

Project: `fanatic-crm`

Base URL:

```text
https://iavkvtkoowwkvizjpasy.supabase.co
```

## Recommended Order

1. `supabase_schema.sql`

   Base admin CRM tables: clients, sessions, progress items, support notes, file links, intake requests, RLS, and indexes.

2. `supabase_storage.sql`

   Private `client-files` bucket and storage policies.

3. `supabase_client_portal.sql`

   Client access table and safe client-facing RPC functions for the portal.

4. `supabase_lesson_fields.sql`

   Optional session fields for meeting links and confirmation status.

5. `supabase_lms_fields.sql`

   Optional task fields for due dates, teacher comments, and student comments.

6. `supabase_billing_fields.sql`

   Optional lightweight lesson balance and support-until fields.

7. `supabase_calendar.sql`

   Google Calendar connection table and session event mapping fields.

## Notes

- Run migrations from top to bottom on a fresh database.
- On the current project, base schema and portal foundation are already created.
- The optional migrations are written to be re-runnable where possible.
- `supabase_lms_fields.sql` expects the client portal migration to exist because it updates a portal RPC function.
- `supabase_calendar.sql` prepares the database only. Real sync still needs the Google Calendar API setup and Edge Function.

## Quick psql Pattern

```powershell
$env:PGPASSWORD = "<database-password>"
psql "host=aws-0-eu-west-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.iavkvtkoowwkvizjpasy sslmode=require" -f .\supabase_lesson_fields.sql
```

Replace the filename with the migration you want to apply.

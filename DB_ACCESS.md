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

Current test data:

- `Codex Test Client`
- one progress item
- one session
- one support note

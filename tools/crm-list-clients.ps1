param(
  [string]$OwnerEmail = "direct@fanatic.space",
  [int]$Limit = 20
)

$ErrorActionPreference = "Stop"

if (-not $env:PGPASSWORD) {
  throw "Set `$env:PGPASSWORD to the Supabase database password before running this script."
}

$psql = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psql) {
  $fallback = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
  if (Test-Path $fallback) {
    $psql = @{ Source = $fallback }
  } else {
    throw "psql was not found. Install PostgreSQL client tools first."
  }
}

$connection = "host=aws-0-eu-west-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.iavkvtkoowwkvizjpasy sslmode=require"

$sql = @"
select
  c.id,
  c.name,
  c.email,
  c.status,
  c.plan,
  c.created_at
from public.clients c
join auth.users u on u.id = c.owner_id
where u.email = '$OwnerEmail'
order by c.created_at desc
limit $Limit;
"@

& $psql.Source $connection -c $sql

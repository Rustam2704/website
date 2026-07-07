function Get-CrmPsql {
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if ($psql) {
    return $psql.Source
  }

  $fallback = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
  if (Test-Path $fallback) {
    return $fallback
  }

  throw "psql was not found. Install PostgreSQL client tools first."
}

function Get-CrmPgDump {
  $pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
  if ($pgDump) {
    return $pgDump.Source
  }

  $fallback = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
  if (Test-Path $fallback) {
    return $fallback
  }

  throw "pg_dump was not found. Install PostgreSQL client tools first."
}

function Get-CrmConnectionString {
  if (-not $env:PGPASSWORD) {
    throw "Set `$env:PGPASSWORD to the Supabase database password before running this script."
  }

  return "host=aws-0-eu-west-1.pooler.supabase.com port=6543 dbname=postgres user=postgres.iavkvtkoowwkvizjpasy sslmode=require"
}

function ConvertTo-SqlText([string]$Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return "null"
  }

  return "'" + $Value.Replace("'", "''") + "'"
}

function Invoke-CrmPsql([string]$ConnectionString, [string]$Sql) {
  $psql = Get-CrmPsql
  & $psql $ConnectionString -c $Sql
}

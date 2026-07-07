$ErrorActionPreference = "Stop"

Write-Output "Checking public deployment..."
& "$PSScriptRoot\check-public.ps1"

Write-Output ""
Write-Output "Checking Supabase infrastructure..."
& "$PSScriptRoot\check-supabase.ps1"

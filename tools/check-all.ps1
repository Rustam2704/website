$ErrorActionPreference = "Stop"

Write-Output "Checking public deployment..."
& "$PSScriptRoot\check-public.ps1" | Format-Table -AutoSize

Write-Output ""
Write-Output "Checking Supabase infrastructure..."
& "$PSScriptRoot\check-supabase.ps1"

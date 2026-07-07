$ErrorActionPreference = "Stop"

Write-Output "Git status"
& "C:\Program Files\Git\cmd\git.exe" status --short

Write-Output ""
Write-Output "Public deployment"
& "$PSScriptRoot\check-public.ps1"

Write-Output ""
Write-Output "Supabase infrastructure"
& "$PSScriptRoot\check-supabase.ps1"

Write-Output ""
Write-Output "CRM summary"
& "$PSScriptRoot\crm-summary.ps1"

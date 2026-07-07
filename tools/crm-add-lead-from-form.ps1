param(
  [Parameter(Mandatory = $true)]
  [string]$Name,

  [Parameter(Mandatory = $true)]
  [string]$Email,

  [string]$Area = "",
  [string]$Goal = "",
  [string]$Timezone = "",
  [ValidateSet("session_only", "session_plus_support")]
  [string]$Plan = "session_only"
)

$ErrorActionPreference = "Stop"

& "$PSScriptRoot\crm-add-client.ps1" `
  -Name $Name `
  -Email $Email `
  -Timezone $Timezone `
  -Plan $Plan `
  -Area $Area `
  -CurrentGoal $Goal `
  -Status "lead"

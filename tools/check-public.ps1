$ErrorActionPreference = "Stop"

$checks = @(
  @{
    Url = "https://fanatic.space/"
    Pattern = "Technical Coaching"
  },
  @{
    Url = "https://fanatic.space/crm/"
    Pattern = "Fanatic CRM"
  },
  @{
    Url = "https://fanatic.space/portal/"
    Pattern = "Fanatic Client Portal"
  },
  @{
    Url = "https://fanatic.space/thanks/"
    Pattern = "request"
  }
)

foreach ($check in $checks) {
  $response = Invoke-WebRequest -UseBasicParsing $check.Url -TimeoutSec 15
  $ok = $response.StatusCode -eq 200 -and $response.Content -match $check.Pattern
  [pscustomobject]@{
    Url = $check.Url
    Status = $response.StatusCode
    Pattern = $check.Pattern
    Ok = $ok
  }

  if (-not $ok) {
    throw "Public check failed for $($check.Url)"
  }
}

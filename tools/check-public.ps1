$ErrorActionPreference = "Stop"

$checks = @(
  @{
    Url = "https://fanatic.space/"
    Pattern = "Technical Coaching"
  },
  @{
    Url = "https://fanatic.space/crm/"
    Pattern = "Fanatic CRM"
    Robots = "noindex"
  },
  @{
    Url = "https://fanatic.space/portal/"
    Pattern = "Fanatic Client Portal"
    Robots = "noindex"
  },
  @{
    Url = "https://fanatic.space/thanks/"
    Pattern = "request"
  }
)

foreach ($check in $checks) {
  $response = Invoke-WebRequest -UseBasicParsing $check.Url -TimeoutSec 15
  $robotsHeader = [string]$response.Headers["X-Robots-Tag"]
  $robotsOk = -not $check.Robots -or $robotsHeader -match $check.Robots
  $ok = $response.StatusCode -eq 200 -and $response.Content -match $check.Pattern -and $robotsOk
  [pscustomobject]@{
    Url = $check.Url
    Status = $response.StatusCode
    Pattern = $check.Pattern
    Robots = $robotsHeader
    Ok = $ok
  }

  if (-not $ok) {
    throw "Public check failed for $($check.Url)"
  }
}

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Net.Http

function Test-Redirect {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url,

    [Parameter(Mandatory = $true)]
    [string]$ExpectedLocation
  )

  $handler = [System.Net.Http.HttpClientHandler]::new()
  $handler.AllowAutoRedirect = $false

  $client = [System.Net.Http.HttpClient]::new($handler)

  try {
    $response = $client.GetAsync($Url).GetAwaiter().GetResult()
    $location = [string]$response.Headers.Location
    $ok = [int]$response.StatusCode -eq 301 -and $location -eq $ExpectedLocation

    [pscustomobject]@{
      Url = $Url
      Status = [int]$response.StatusCode
      Location = $location
      Ok = $ok
    }

    if (-not $ok) {
      throw "Redirect check failed for $Url"
    }
  }
  finally {
    $client.Dispose()
    $handler.Dispose()
  }
}

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

Test-Redirect `
  -Url "https://www.fanatic.space/test-path?x=1" `
  -ExpectedLocation "https://fanatic.space/test-path?x=1"

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

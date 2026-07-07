$ErrorActionPreference = "Stop"

$pages = @(
  @{ Name = "landing"; Url = "https://fanatic.space/" },
  @{ Name = "crm"; Url = "https://fanatic.space/crm/" },
  @{ Name = "portal"; Url = "https://fanatic.space/portal/" },
  @{ Name = "thanks"; Url = "https://fanatic.space/thanks/" }
)

$results = foreach ($page in $pages) {
  $response = Invoke-WebRequest -Uri $page.Url -UseBasicParsing
  $styles = [regex]::Matches($response.Content, '<link[^>]+href="([^"]+\.css[^"]*)"') |
    ForEach-Object { $_.Groups[1].Value }
  $scripts = [regex]::Matches($response.Content, '<script[^>]+src="([^"]+)"') |
    ForEach-Object { $_.Groups[1].Value }

  [pscustomobject]@{
    Name = $page.Name
    Url = $page.Url
    Status = [int]$response.StatusCode
    Styles = ($styles -join "; ")
    Scripts = ($scripts -join "; ")
  }
}

$results | Format-List

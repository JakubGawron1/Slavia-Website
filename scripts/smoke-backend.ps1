param(
  [string]$BaseUrl = $env:SLAVIA_API_BASE_URL
)
$ErrorActionPreference = 'Stop'
if (-not $BaseUrl) {
  $BaseUrl = 'http://127.0.0.1:8080'
}
$BaseUrl = $BaseUrl.TrimEnd('/')

$r1 = Invoke-WebRequest -Uri "$BaseUrl/" -UseBasicParsing -TimeoutSec 15
if ($r1.StatusCode -ne 200) {
  throw "GET / zwróciło $($r1.StatusCode)"
}

$r2 = Invoke-WebRequest -Uri "$BaseUrl/api/athletes" -UseBasicParsing -TimeoutSec 15
if ($r2.StatusCode -ne 200) {
  throw "GET /api/athletes zwróciło $($r2.StatusCode)"
}

$r3 = Invoke-WebRequest -Uri "$BaseUrl/api/results/public-board-olympic" -UseBasicParsing -TimeoutSec 15
if ($r3.StatusCode -ne 200) {
  throw "GET /api/results/public-board-olympic zwróciło $($r3.StatusCode)"
}

try {
  Invoke-WebRequest -Uri "$BaseUrl/api/system/metrics" -UseBasicParsing -TimeoutSec 15 | Out-Null
  throw "GET /api/system/metrics bez tokenu powinno być zablokowane"
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  if ($code -ne 401) {
    throw "GET /api/system/metrics bez tokenu zwróciło $code (oczekiwano 401)"
  }
}

Write-Host "Smoke OK: publiczne endpointy działają, a /api/system/metrics wymaga autoryzacji."

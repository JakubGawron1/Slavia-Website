param(
  [string]$ApiBase = $env:SLAVIA_API_BASE_URL
)
$ErrorActionPreference = 'Stop'

Write-Host "== Slavia-frontend release check =="

Write-Host "[1/6] openapi drift check"
pnpm openapi:check

Write-Host "[2/6] pnpm typecheck"
pnpm typecheck

Write-Host "[3/6] pnpm build"
pnpm build

Write-Host "[4/6] bundle size report"
pnpm bundle:report

Write-Host "[5/6] smoke backend"
if ($ApiBase) {
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke-backend.ps1 -BaseUrl $ApiBase
} else {
  pnpm smoke:backend
}

$BffUrl = $env:SLAVIA_BFF_URL
if ($BffUrl) {
  Write-Host "[6/6] optional BFF AI public status"
  $bff = $BffUrl.TrimEnd('/')
  $r5 = Invoke-WebRequest -Uri "$bff/api/ai/public/status" -UseBasicParsing -TimeoutSec 20
  if ($r5.StatusCode -ne 200) {
    throw "GET /api/ai/public/status (BFF) zwróciło $($r5.StatusCode)"
  }
  $body = $r5.Content | ConvertFrom-Json
  if ($null -eq $body.available) {
    throw "BFF /api/ai/public/status — brak pola available w JSON"
  }
  Write-Host "BFF AI status OK (available=$($body.available))"
} else {
  Write-Host "[6/6] skip BFF AI healthcheck (ustaw SLAVIA_BFF_URL=http://127.0.0.1:3000 aby włączyć)"
}

Write-Host "OK: frontend release check completed."

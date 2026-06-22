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
if ($ApiBase) {
  Write-Host "[6/6] optional backend AI public status"
  $base = $ApiBase.TrimEnd('/')
  $r5 = Invoke-WebRequest -Uri "$base/api/ai/coach/public/status" -UseBasicParsing -TimeoutSec 20
  if ($r5.StatusCode -ne 200) {
    throw "GET /api/ai/coach/public/status zwróciło $($r5.StatusCode)"
  }
  $body = $r5.Content | ConvertFrom-Json
  if ($null -eq $body.enabled) {
    throw "Backend /api/ai/coach/public/status — brak pola enabled w JSON"
  }
  Write-Host "Backend AI public status OK (enabled=$($body.enabled))"
} else {
  Write-Host "[6/6] skip backend AI public status (ustaw SLAVIA_API_BASE_URL aby włączyć)"
}

Write-Host "OK: frontend release check completed."

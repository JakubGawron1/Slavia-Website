param(
  [string]$ApiBase = $env:SLAVIA_API_BASE_URL
)
$ErrorActionPreference = 'Stop'

Write-Host "== Slavia-frontend release check =="

Write-Host "[1/4] openapi drift check"
pnpm openapi:check

Write-Host "[2/4] pnpm typecheck"
pnpm typecheck

Write-Host "[3/4] pnpm build"
pnpm build

Write-Host "[4/4] smoke backend"
if ($ApiBase) {
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke-backend.ps1 -BaseUrl $ApiBase
} else {
  pnpm smoke:backend
}

Write-Host "OK: frontend release check completed."

# Observability — ekosystem Slavia

Krótki przewodnik operatorski dla produkcji **HF (backend) + Vercel (frontend)**. Szczegóły Prometheus po stronie Rust: [`Slavia-backend/docs/OBSERVABILITY.md`](../../Slavia-backend/docs/OBSERVABILITY.md).

---

## Backend — Prometheus stub (`PROMETHEUS_METRICS=1`)

| Element | Wartość |
|---------|---------|
| Włączenie | Zmienna `PROMETHEUS_METRICS=1` w panelu HF Space (Variables) |
| Endpoint | `GET https://{space}.hf.space/metrics` |
| Format | Prometheus text exposition (countery HTTP) |
| Auth | Brak |

**Różnica od panelu WWW:** `GET /api/system/metrics` to JSON dla trenera/admina (Bearer JWT), **nie** scrape Prometheus.

### Szybki test po deployu backendu

```bash
curl -sS "https://koliber-cks-slavia.hf.space/metrics" | grep slavia_http
```

Oczekiwany fragment: `slavia_http_requests_total`, `slavia_http_errors_total`. Brak trasy → sprawdź `PROMETHEUS_METRICS=1` i redeploy Space.

### Scrape zewnętrzny

Prometheus / Grafana Cloud scrapuje `/metrics` z interwałem ≥ 60 s. Przykład `prometheus.yml` i uwagi HF (cold start, TLS) — w dokumentacji backendu (link powyżej).

---

## Frontend — smoke i health

| Narzędzie | Co sprawdza |
|-----------|-------------|
| `pnpm smoke:post-deploy` | HF `/api/health` + Vercel `/api/system/backend-provider` |
| `pnpm smoke:backend` | Lokalny / skonfigurowany ping API przed pracą z panelami |
| `scripts/post-deploy-smoke.mjs` | Szczegóły env: `SLAVIA_HF_API_URL`, `SLAVIA_SITE_URL` — patrz [`deploy-hf-vercel.md`](deploy-hf-vercel.md#post-deploy-smoke) |

Metryki Prometheus **nie** przechodzą przez BFF Nuxt — scraper łączy się bezpośrednio z URL Space.

---

## GitHub Actions (backend repo)

| Workflow | Cel |
|----------|-----|
| `keep-warm.yml` | Co 5 min `GET /api/system/ping` — mniej cold startów HF |
| `metrics-scrape-stub.yml` | Co godzinę `GET /metrics` — canary gdy włączony Prometheus |

Wspólny secret: `HF_API_BASE_URL` (bez końcowego slasha). Gdy sekret pusty, joby są pomijane.

---

## SuperAdmin — metryki aplikacyjne (nie Prometheus)

| Moduł WWW | API |
|-----------|-----|
| `/superadmin/workers` | Worker cron runs, standing-order catchup |
| Panel developer | Provider backendu, health BFF |

To dane biznesowe/operacyjne z JSON API, nie z `/metrics`.

---

## Backlog

| ID | Temat | Status |
|----|-------|--------|
| OBS-1 | Prometheus backend (stub counterów) | ✅ kod + docs |
| OBS-2 | Error plugin FE z kontekstem modułu | backlog |
| OBS-3 | Groq latency metrics | backlog |

Pełna mapa: `improve.md` §10.

# -*- coding: utf-8 -*-
"""Generates ideas 211-1000 for ideas.md (one-off)."""
from pathlib import Path

topics = [
    "rankingu",
    "kalendarza",
    "profilu zawodnika",
    "czatu",
    "płatności",
    "wyników",
    "bloga",
    "galerii",
    "planu treningowego",
    "dziennika",
    "powiadomień",
    "panelu admina",
    "panelu trenera",
    "superadmina",
    "raportów PDF",
    "wykresów",
    "filtrów globalnych",
    "eksportu CSV",
    "importu danych",
    "ustawień konta",
    "osi czasu",
    "zgłoszeń ćwiczeń dodatkowych",
    "obecności",
    "regeneracji",
    "aktualności klubu",
]

lines_out: list[str] = []

lines_out.append("")
lines_out.append("---")
lines_out.append("")
lines_out.append(
    "## Bank pomysłów 211–1000 (frontend · backend · mobilka · platforma)"
)
lines_out.append("")
lines_out.append(
    "Uzupełnienie listy 1–210. Numery **211–1000** są ciągłe w całym pliku. "
    "Podział sekcji pomaga filtrować backlog — realizacja według priorytetu biznesowego."
)
lines_out.append("")

# --- 211–420 Frontend ---
lines_out.append("### Frontend (Nuxt — www, panele ról, DevTools)")
lines_out.append("")
fe_patterns = [
    "Skeleton / shimmer dopasowany do `{t}` — mniej layout shift przy hydracji.",
    "Prefetch tras powiązanych z `{t}` po `IntersectionObserver` kart na liście.",
    "Virt lista (`@tanstack/vue-virtual`) dla długiej listy w `{t}` (>300 wierszy).",
    "Tryb kompaktowy tabletkowy dla `{t}` — wyższa densyjność bez utraty dotykowych celów.",
    "Skróty klawiszowe (⌘/Ctrl) w `{t}` — udokumentowane w `?` help overlay.",
    "Eksport widoku `{t}` do CSV z nagłówkiem UTF-8 i znacznikiem czasu generacji.",
    "Porównanie „przed/po zapisem” w formularzu `{t}` — podświetlenie zmienionych pól.",
    "Story / Histoire dla izolowanego komponentu `{t}` — regresje wizualne.",
    "Test a11y (axe) dla ścieżki krytycznej `{t}` — brak krytycznych violations.",
    "Telemetria Web Vitals (opcjonalnie) dla strony z `{t}` — LCP, INP.",
]

for n in range(211, 421):
    pat = fe_patterns[(n - 211) % len(fe_patterns)]
    t = topics[(n * 7 + 3) % len(topics)]
    lines_out.append(f"{n}. **FE — {pat.format(t=t)}**")

lines_out.append("")
lines_out.append("### Backend (Rust, API, SQLite, worker, bezpieczeństwo)")
lines_out.append("")

be_patterns = [
    "Indeks złożony pod zapytanie `{t}` — zweryfikować `EXPLAIN QUERY PLAN`.",
    "Idempotentny POST dla `{t}` — nagłówek `Idempotency-Key` + unikalny constraint.",
    "Paginacja kursorowa dla listy `{t}` — stabilna przy równoległych zapisach.",
    "Webhook outbox dla zdarzeń `{t}` — retry z backoff, dead-letter queue.",
    "Cron job: agregaty dzienne dla `{t}` — tabela podsumowań + cronometr w logach.",
    "Soft-delete z TTL dla `{t}` — archiwizacja po 90 dniach (konfigurowalnie).",
    "Rate limit per IP i per user dla endpointów `{t}` — osobne kubełki.",
    "Walidacja schema JSON (serde) dla payloadów `{t}` — testy negatywne.",
    "Audit log wpisu dla mutacji `{t}` — kto, kiedy, stary vs nowy snapshot.",
    "Feature flag serwerowy dla `{t}` — odczyt z env / tabeli konfiguracji.",
]

for n in range(421, 631):
    pat = be_patterns[(n - 421) % len(be_patterns)]
    t = topics[(n * 5) % len(topics)]
    lines_out.append(f"{n}. **BE — {pat.format(t=t)}**")

lines_out.append("")
lines_out.append("### Mobilka (Flutter) i kanały powiązane")
lines_out.append("")

mob_patterns = [
    "Parzystość ekranu `{t}` z www — ten sam porządek pól i walidacji.",
    "Offline queue dla akcji `{t}` — retry z exponential backoff.",
    "Deep link (`slavia://…`) do `{t}` — mapowanie w `go_router`.",
    "Widget startowy pokazujący skrót do `{t}` (Android/iOS).",
    "Duży tekst / scaling dla `{t}` — test przy `textScaleFactor` 1.3.",
    "Screenshot-ready layout dla `{t}` — ukrycie danych wrażliwych opcjonalnie.",
    "Powiadomienie lokalne zsynchronizowane z `{t}` — harmonogram `timezone`.",
    "Integracja Share Sheet eksportu z `{t}` — PNG/CSV z metadanymi klubu.",
    "Golden test UI fragmentu `{t}` — regresja przy zmianie motywu.",
    "Battery-aware sync dla `{t}` — rzadsze odświeżanie przy <15% baterii.",
]

for n in range(631, 821):
    pat = mob_patterns[(n - 631) % len(mob_patterns)]
    t = topics[(n * 11) % len(topics)]
    lines_out.append(f"{n}. **MOB — {pat.format(t=t)}**")

lines_out.append("")
lines_out.append("### Platforma, multi-klub, partnerzy, DevOps, produkt")
lines_out.append("")

pl_topics = [
    "multi-tenant schema",
    "partner API SLA",
    "white-label motywów",
    "rozliczenia per aktywny zawodnik",
    "region EU-only dla danych",
    "backup point-in-time",
    "disaster recovery drill",
    "status page publiczny",
    "program partnerski dla klubów",
    "certyfikat klubu (trust badge)",
    "SDK JavaScript dla widgetów osadzanych",
    "konkurs federacji na read-only API",
    "sandbox API dla developerów",
    "quota i fair-use policy",
    "RODO — DPIA template",
    "szkolenie kadry z produktu",
    "template umowy B2B klub–platforma",
    "referral program klubów",
    "integracja księgowa (eksport FK)",
    "analityka produktowa (bez PII)",
]

for n in range(821, 1001):
    topic = pl_topics[(n - 821) % len(pl_topics)]
    idx = (n - 821) // len(pl_topics) + 1
    lines_out.append(
        f"{n}. **PL — {topic} (wariant #{idx})** — backlog biznesowy; estimacja i owner przed sprintem."
    )

out_path = Path(__file__).resolve().parents[1] / ".ideas_generated_chunk.md"
out_path.write_text("\n".join(lines_out) + "\n", encoding="utf-8")
print(f"Wrote {len(lines_out)} lines to {out_path}")

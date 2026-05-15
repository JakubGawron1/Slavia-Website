# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ideas_path = root / "ideas.md"
chunk_path = root / ".ideas_roles_chunk.md"

ideas = ideas_path.read_text(encoding="utf-8")
chunk = chunk_path.read_text(encoding="utf-8").lstrip("\n")
if chunk.startswith("---\n"):
    chunk = chunk[4:]

marker = (
    "2000. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.\n\n"
    "---\n\n"
    "*Ten plik służy do planowania; nie wiąże się automatycznie z backlogiem ani commitami. Aktualizuj po większych zmianach w produkcie.*"
)
if marker not in ideas:
    raise SystemExit("marker not found")

replacement = (
    "2000. **RD — Proof-of-concept `heat mapy sali z czujników IoT` (fala #10)** — budżet R&D; brak obietnicy wdrożenia produkcyjnego.\n\n"
    + chunk.rstrip()
    + "\n\n---\n\n"
    + "*Ten plik służy do planowania; nie wiąże się automatycznie z backlogiem ani commitami. Aktualizuj po większych zmianach w produkcie.*"
)
ideas = ideas.replace(marker, replacement)

intro_old = (
    "Numery **1–2100** są jednolite w całym pliku (banki **211–1000**, **1001–2000**, blok **2001–2100** wg ról)."
)
intro_new = (
    "Numery **1–2300** są jednolite w całym pliku (banki **211–1000**, **1001–2000**, blok **2001–2300** wg ról z prefiksami **ZAW / TRE / ADM / SUP**)."
)
if intro_old in ideas:
    ideas = ideas.replace(intro_old, intro_new)
else:
    # fallback jeśli wcześniejszy nagłówek był inny
    intro_fallback = (
        "Numery **1–1000** są jednolite w całym pliku (sekcje tematyczne od ## Bank pomysłów 211–1000). "
        "Powoływanie się na numery w ticketach i changelogu."
    )
    if intro_fallback in ideas:
        ideas = ideas.replace(
            intro_fallback,
            "Numery **1–2300** są jednolite (bank **211–1000**, **1001–2000**, **2001–2300** wg ról ZAW/TRE/ADM/SUP). "
            "Powoływanie się na numery w ticketach i changelogu.",
        )

ideas_path.write_text(ideas, encoding="utf-8")
print("Merged roles chunk OK")

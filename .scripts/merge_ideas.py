# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ideas = (root / "ideas.md").read_text(encoding="utf-8")
chunk = (root / ".ideas_generated_chunk.md").read_text(encoding="utf-8").lstrip("\n")
if chunk.startswith("---\n"):
    chunk = chunk[4:]

marker = (
    "210. **Roadmapa publiczna** — synchronizacja wybranych numerów z tego pliku z changelogiem apki w sklepie.\n\n"
    "---\n\n"
    "*Ten plik służy do planowania; nie wiąże się automatycznie z backlogiem ani commitami. Aktualizuj po większych zmianach w produkcie.*"
)
if marker not in ideas:
    raise SystemExit("marker block not found in ideas.md")

replacement = (
    "210. **Roadmapa publiczna** — synchronizacja wybranych numerów z tego pliku z changelogiem apki w sklepie.\n\n"
    + chunk.rstrip()
    + "\n\n---\n\n"
    + "*Ten plik służy do planowania; nie wiąże się automatycznie z backlogiem ani commitami. Aktualizuj po większych zmianach w produkcie.*"
)
ideas = ideas.replace(marker, replacement)

# Nagłówek: zaktualizuj opis zakresu numerów
old_intro = (
    "Zbiór propozycji po przeglądzie kodu (`Slavia-frontend`, typy tras z `api.ts`, narzędzia eksperymentalne, backend w repozytorium Rust). "
    "Kolejność i realizacja według Waszej kadry. Numery są **jednolite w całym pliku**, żeby łatwo się na nie powoływać."
)
new_intro = (
    "Zbiór propozycji po przeglądzie kodu (`Slavia-frontend`, typy tras z `api.ts`, narzędzia eksperymentalne, backend w repozytorium Rust, aplikacja mobilna Flutter). "
    "Kolejność i realizacja według Waszej kadry. Numery **1–1000** są jednolite w całym pliku (sekcje tematyczne od ## Bank pomysłów 211–1000). "
    "Powoływanie się na numery w ticketach i changelogu."
)
if old_intro not in ideas:
    raise SystemExit("intro paragraph not found")
ideas = ideas.replace(old_intro, new_intro)

(root / "ideas.md").write_text(ideas, encoding="utf-8")
print("Merged OK; ideas.md size:", len(ideas))

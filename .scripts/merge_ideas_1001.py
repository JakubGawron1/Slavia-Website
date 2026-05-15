# -*- coding: utf-8 -*-
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ideas_path = root / "ideas.md"
chunk_path = root / ".ideas_chunk_1001_2000.md"

ideas = ideas_path.read_text(encoding="utf-8")
chunk = chunk_path.read_text(encoding="utf-8").lstrip("\n")
if chunk.startswith("---\n"):
    chunk = chunk[4:]

marker = (
    "1000. **PL — analityka produktowa (bez PII) (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.\n\n"
    "---\n\n"
    "*Ten plik służy do planowania; nie wiąże się automatycznie z backlogiem ani commitami. Aktualizuj po większych zmianach w produkcie.*"
)

if marker not in ideas:
    raise SystemExit("marker not found — sprawdz końcówkę ideas.md")

replacement = (
    "1000. **PL — analityka produktowa (bez PII) (wariant #9)** — backlog biznesowy; estimacja i owner przed sprintem.\n\n"
    + chunk.rstrip()
    + "\n\n---\n\n"
    + "*Ten plik służy do planowania; nie wiąże się automatycznie z backlogiem ani commitami. Aktualizuj po większych zmianach w produkcie.*"
)

ideas_path.write_text(ideas.replace(marker, replacement), encoding="utf-8")
print("Merged 1001–2000 OK")

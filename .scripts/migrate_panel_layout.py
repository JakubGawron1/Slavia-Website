"""Migrate page wrappers to PanelPageLayout (batch helpers)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "app" / "pages"

REPLACEMENTS = [
    # (file_relative, old, new)
    (
        "trainer/wyniki.vue",
        '  <UContainer class="py-8 md:py-14 lg:py-16 animate-page-in">',
        "  <PanelPageLayout>",
    ),
    (
        "trainer/wyniki.vue",
        """    <motion class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-primary">
          Kadra
        </p>
        <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted">
          Wszystkie starty zawodników
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Pełna lista zgłoszeń (oczekujących i zatwierdzonych). Jako kadra możesz
          <strong class="text-highlighted">dodać start od razu jako zatwierdzony</strong>
          — bez kolejki akceptacji. Edycja i usuwanie jak dotąd.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton
          icon="i-lucide-plus-circle"
          @click="openAddModal"
        >
          Dodaj wynik (zatwierdzony)
        </UButton>
        <UButton
          icon="i-lucide-refresh-ccw"
          variant="soft"
          :loading="pending"
          @click="refresh()"
        >
          Odśwież
        </UButton>
      </div>
    </div>

    <div class="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-default/60 bg-muted/15 p-1.5">""",
        """    <PanelPageHeader
      area="trainer"
      title="Wszystkie starty zawodników"
      icon="i-lucide-list-checks"
    >
      <template #description>
        Pełna lista zgłoszeń (oczekujących i zatwierdzonych). Jako kadra możesz
        <strong class="text-highlighted">dodać start od razu jako zatwierdzony</strong>
        — bez kolejki akceptacji. Edycja i usuwanie jak dotąd.
      </template>
      <template #actions>
        <UButton icon="i-lucide-plus-circle" @click="openAddModal">
          Dodaj wynik (zatwierdzony)
        </UButton>
        <UButton icon="i-lucide-refresh-ccw" variant="soft" :loading="pending" @click="refresh()">
          Odśwież
        </UButton>
      </template>
    </PanelPageHeader>

    <motion class="slavia-toolbar mb-4">""",
    ),
]

# fix motion typo in script output
def fix_motion(s: str) -> str:
    return s.replace("<motion ", "<motion ").replace("</motion>", "</motion>").replace(
        'class="slavia-toolbar', 'class="slavia-toolbar'
    ).replace("<motion class=\"slavia-toolbar", '<motion class="slavia-toolbar').replace(
        '<motion class="slavia-toolbar', '<div class="slavia-toolbar'
    )


for rel, old, new in REPLACEMENTS:
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    old = old.replace("<motion ", "<div ").replace("</motion>", "</div>")
    new = new.replace("<motion ", "<div ").replace("</motion>", "</motion>")
    new = new.replace("</motion>", "</div>").replace('<motion class="slavia-toolbar', '<div class="slavia-toolbar')
    if old not in text:
        print("SKIP (old not found):", rel)
        continue
    text = text.replace(old, new, 1)
    text = text.replace("  </UContainer>\n</template>", "  </PanelPageLayout>\n</template>", 1)
    p.write_text(text, encoding="utf-8")
    print("OK:", rel)

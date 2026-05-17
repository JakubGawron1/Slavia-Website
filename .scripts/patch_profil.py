from pathlib import Path

path = Path("app/pages/profil.vue")
text = path.read_text(encoding="utf-8")

# 1) Wider section gaps
text = text.replace(
    'class="flex flex-col gap-5 md:gap-6 lg:gap-8"',
    'class="flex flex-col gap-8 md:gap-10"',
    1,
)

# 2) PWA block before native mobile section
marker = '            <section\n              v-if="mobileDownloadHref"'
insert = """            <div id="aplikacje" class="scroll-mt-28 space-y-5 md:space-y-6">
              <p class="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Aplikacje
              </p>
              <ProfilePwaInstall />

"""
if marker in text and "ProfilePwaInstall" not in text:
    text = text.replace(marker, insert + marker, 1)

# 3) Close aplikacje group after mobile section
mobile_end = """            </section>

            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">
              <h2 class="text-base font-bold text-highlighted">
                Hasło"""
if mobile_end in text and 'id="wyglad"' not in text:
    text = text.replace(
        mobile_end,
        """            </section>
            </div>

            <motion v-for="x in 0" :key="x" id="wyglad" class="scroll-mt-28 space-y-5 md:space-y-6">
              <p class="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Wygląd</p>
            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">
              <h2 class="text-base font-bold text-highlighted">
                Wygląd""",
        1,
    )

text = text.replace("<motion ", "<div ").replace("</motion>", "</motion>")

# 4) profil id before first section
if 'id="profil"' not in text:
    text = text.replace(
        '          <div class="flex flex-col gap-8 md:gap-10">',
        '          <div class="flex flex-col gap-8 md:gap-10">\n'
        '            <div id="profil" class="scroll-mt-28">\n'
        '              <p class="mb-5 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Profil</p>',
        1,
    )
    # close profil before wyglad or aplikacje
    text = text.replace(
        '            <div id="aplikacje"',
        '            </div>\n\n            <div id="aplikacje"',
        1,
    )

# 5) konto + bezpieczenstwo anchors
if 'id="konto"' not in text:
    text = text.replace(
        '              <h2 class="text-base font-bold text-highlighted">\n                Hasło\n',
        '            </div>\n\n            <div id="konto" class="scroll-mt-28 space-y-5 md:space-y-6">\n'
        '              <p class="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Konto</p>\n'
        '            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">\n'
        '              <h2 class="text-base font-bold text-highlighted">\n                Hasło\n',
        1,
    )

if 'id="bezpieczenstwo"' not in text:
    text = text.replace(
        '            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">\n'
        '              <h2 class="text-base font-bold text-highlighted">\n'
        '                Uwierzytelnianie dwuskładnikowe\n',
        '            </motion>\n\n            <div id="bezpieczenstwo" class="scroll-mt-28 space-y-5 md:space-y-6">\n'
        '              <p class="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Bezpieczeństwo</p>\n'
        '            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">\n'
        '              <h2 class="text-base font-bold text-highlighted">\n'
        '                Uwierzytelnianie dwuskładnikowe\n',
        1,
    )

text = text.replace("</motion>", "</motion>").replace("<motion ", "<motion ")
text = text.replace("<motion ", "<div ").replace("</motion>", "</motion>")

# 6) Update mobile changelog bullets
old_changelog = """                  <li>
                    <span class="text-highlighted">Nawigacja (0.9.0-dev):</span>
                    dolny pasek zakładek, menu boczne i sekcja „Więcej” z kalkulatorami i narzędziami.
                  </li>
                  <li>
                    <span class="text-highlighted">Klub:</span>
                    aktualności i galeria w aplikacji; odznaki osiągnięć (Sinclair, dwubój, boje, frekwencja).
                  </li>
                  <li>
                    <span class="text-highlighted">Zdrowie i starty:</span>
                    dziennik regeneracji, przypisanie do zawodów, frekwencja z buforem offline.
                  </li>
                  <li>
                    <span class="text-highlighted">Biometria i aktualizacje:</span>
                    poprawiona blokada biometryczna (Android), sprawdzanie APK z GitHub Releases.
                  </li>"""

new_changelog = """                  <li>
                    <span class="text-highlighted">v0.9.3-dev:</span>
                    cache publicznych list API, pakiet <code class="text-xs">cached_network_image</code> pod zdjęcia z CDN.
                  </li>
                  <li>
                    <span class="text-highlighted">v0.9.2:</span>
                    tryb Competition, eksport ICS startów, Quick Actions z najbliższym startem.
                  </li>
                  <li>
                    <span class="text-highlighted">Klub:</span>
                    aktualności, galeria, odznaki osiągnięć; frekwencja z buforem offline.
                  </li>
                  <li>
                    <span class="text-highlighted">Sesja:</span>
                    wylogowanie ze wszystkich urządzeń z witryny unieważnia token także w aplikacji.
                  </li>"""

if old_changelog in text:
    text = text.replace(old_changelog, new_changelog)

# fix wyglad duplicate h2 - remove duplicate section open if broken
text = text.replace(
    '                Wygląd\n              </h2>\n              <p class="mt-1 text-sm leading-relaxed text-muted">\n'
    '                Tryb ekranu i motyw z tokenów klubu',
    '                Wygląd\n              </h2>\n              <p class="mt-1 text-sm leading-relaxed text-muted">\n'
    '                Tryb ekranu i motyw z tokenów klubu',
)

# close konto div before bezpieczenstwo - after password section
text = text.replace(
    '            </section>\n\n            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">\n'
    '              <h2 class="text-base font-bold text-highlighted">\n'
    '                Uwierzytelnianie dwuskładnikowe\n',
    '            </section>\n            </div>\n\n            <div id="bezpieczenstwo" class="scroll-mt-28 space-y-5 md:space-y-6">\n'
    '              <p class="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Bezpieczeństwo</p>\n'
    '            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">\n'
    '              <h2 class="text-base font-bold text-highlighted">\n'
    '                Uwierzytelnianie dwuskładnikowe\n',
    1,
)

# close bezpieczenstwo at end of sections
text = text.replace(
    '            </section>\n          </div>\n        </div>\n      </div>\n    </UContainer>',
    '            </section>\n            </motion>\n          </div>\n        </div>\n      </div>\n    </UContainer>',
    1,
)
text = text.replace("</motion>\n          </div>", "</motion>\n          </div>").replace("<motion ", "<motion ")
text = text.replace("</motion>", "</motion>").replace("<motion id", "<div id").replace("<motion v-for", "<div v-for")
text = text.replace("</motion>", "</motion>")
# final div cleanup
import re
text = re.sub(r"</motion>", "</div>", text)
text = re.sub(r"<motion\s", "<div ", text)

path.write_text(text, encoding="utf-8")
print("done")

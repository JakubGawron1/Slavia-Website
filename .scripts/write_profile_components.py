from pathlib import Path

D = "motion"  # will replace
D = "div"

section_card = """<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    icon?: string
    badge?: string
    badgeColor?: 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'
    tone?: 'default' | 'danger' | 'accent'
  }>(),
  { badgeColor: 'neutral', tone: 'default' }
)
const sectionClass = computed(() => {
  if (props.tone === 'danger') return 'rounded-2xl border border-error/45 bg-error/5 p-6 shadow-sm ring-1 ring-error/20 sm:p-7'
  if (props.tone === 'accent') return 'relative overflow-hidden rounded-2xl border border-primary/30 bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-sm ring-1 ring-primary/20 sm:p-7'
  return 'rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7'
})
</script>
<template>
  <section :class="sectionClass">
    <__TAG__ class="flex flex-wrap items-start justify-between gap-3">
      <__TAG__ class="flex min-w-0 items-start gap-3">
        <__TAG__ v-if="icon" class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
          <UIcon :name="icon" class="size-5" />
        </__TAG__>
        <__TAG__ class="min-w-0">
          <h2 class="text-base font-bold text-highlighted">{{ title }}</h2>
          <p v-if="description" class="mt-1 text-sm leading-relaxed text-muted">{{ description }}</p>
        </__TAG__>
      </__TAG__>
      <UBadge v-if="badge" variant="soft" :color="badgeColor" size="xs" class="shrink-0 uppercase tracking-wide">{{ badge }}</UBadge>
    </__TAG__>
    <__TAG__ class="mt-5"><slot /></__TAG__>
  </section>
</template>
""".replace("__TAG__", D)

pwa_install = """<script setup lang="ts">
const toast = useToast()
const pwa = useSlaviaPwaInstall()
async function onInstallClick() {
  const ok = await pwa.install()
  if (ok) {
    toast.add({ title: 'Aplikacja zainstalowana', description: 'Slavia jest na ekranie głównym.', color: 'success' })
  } else if (!pwa.canPromptInstall.value) {
    toast.add({ title: 'Użyj instrukcji poniżej', description: 'Przeglądarka nie pokazała okna instalacji.', color: 'warning' })
  }
}
</script>

<template>
  <ProfileSectionCard
    title="Aplikacja WWW (PWA)"
    description="Dodaj witrynę klubu do ekranu głównego — szybki dostęp jak z aplikacji, bez sklepu Play."
    icon="i-lucide-smartphone"
    badge="PWA"
    badge-color="primary"
    tone="accent"
  >
    <UAlert
      v-if="pwa.isInstalled.value"
      color="success"
      variant="subtle"
      icon="i-lucide-check-circle-2"
      title="Zainstalowano"
      description="Korzystasz ze Slavii w trybie aplikacji (standalone)."
    />

    <__TAG__ v-else class="space-y-4">
      <UButton
        v-if="pwa.canPromptInstall.value"
        color="primary"
        size="lg"
        icon="i-lucide-download"
        class="w-full justify-center font-semibold shadow-md sm:w-auto"
        :loading="pwa.installLoading.value"
        @click="onInstallClick"
      >
        Zainstaluj aplikację Slavia
      </UButton>

      <__TAG__ v-if="pwa.showIosGuide.value" class="rounded-xl border border-default/50 bg-muted/10 p-4">
        <p class="text-sm font-semibold text-highlighted">iPhone / iPad (Safari)</p>
        <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Otwórz stronę w <strong class="text-highlighted">Safari</strong> (nie w Chrome).</li>
          <li>Dotknij <strong class="text-highlighted">Udostępnij</strong> (kwadrat ze strzałką).</li>
          <li>Wybierz <strong class="text-highlighted">Dodaj do ekranu początkowego</strong> → Dodaj.</li>
        </ol>
      </__TAG__>

      <__TAG__ v-else-if="pwa.showAndroidManual.value" class="rounded-xl border border-default/50 bg-muted/10 p-4">
        <p class="text-sm font-semibold text-highlighted">Android (Chrome / Edge)</p>
        <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Użyj adresu produkcyjnego (<strong class="text-highlighted">https://</strong>), nie localhost.</li>
          <li>Menu przeglądarki (⋮) → <strong class="text-highlighted">Zainstaluj aplikację</strong> lub <strong class="text-highlighted">Dodaj do ekranu głównego</strong>.</li>
          <li>Jeśli widzisz baner u dołu ekranu — wybierz Zainstaluj.</li>
        </ol>
      </__TAG__>

      <__TAG__ v-else-if="pwa.showDesktopHint.value" class="rounded-xl border border-default/50 bg-muted/10 p-4 text-sm text-muted">
        <p class="font-semibold text-highlighted">Komputer</p>
        <p class="mt-2">W Chrome lub Edge: ikona instalacji w pasku adresu albo menu → Zainstaluj Slavia.</p>
      </__TAG__>

      <details class="rounded-xl border border-dashed border-default/45 bg-muted/5 px-4 py-3 text-sm">
        <summary class="cursor-pointer font-medium text-highlighted">Dlaczego nie widzę przycisku?</summary>
        <ul class="mt-3 list-disc space-y-1.5 pl-5 text-muted">
          <li>Strona musi być na <strong class="text-highlighted">HTTPS</strong> (np. cksslavia.vercel.app).</li>
          <li>Na iOS instalacja działa tylko przez Safari.</li>
          <li>Jeśli PWA jest już dodana — usuń starą ikonę z ekranu głównego.</li>
          <li>W trybie incognito instalacja bywa zablokowana.</li>
        </ul>
      </details>
    </__TAG__>
  </ProfileSectionCard>
</template>
""".replace("__TAG__", D)

Path("app/components/profile/ProfileSectionCard.vue").write_text(section_card, encoding="utf-8")
Path("app/components/profile/ProfilePwaInstall.vue").write_text(pwa_install, encoding="utf-8")
print("written")

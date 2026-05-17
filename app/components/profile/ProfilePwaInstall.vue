<script setup lang="ts">
const toast = useToast()
const {
  canPromptInstall,
  isInstalled,
  showIosGuide,
  showAndroidManual,
  showDesktopHint,
  installLoading,
  install
} = useSlaviaPwaInstall()

async function onInstallClick() {
  const ok = await install()
  if (ok) {
    toast.add({ title: 'Aplikacja zainstalowana', description: 'Slavia jest na ekranie głównym.', color: 'success' })
  } else if (!canPromptInstall.value) {
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
      v-if="isInstalled"
      color="success"
      variant="subtle"
      icon="i-lucide-check-circle-2"
      title="Zainstalowano"
      description="Korzystasz ze Slavii w trybie aplikacji (standalone)."
    />

    <div v-else class="space-y-4">
      <UButton
        v-if="canPromptInstall"
        color="primary"
        size="lg"
        icon="i-lucide-download"
        class="w-full justify-center font-semibold shadow-md sm:w-auto"
        :loading="installLoading"
        @click="onInstallClick"
      >
        Zainstaluj aplikację Slavia
      </UButton>

      <div v-if="showIosGuide" class="rounded-xl border border-default/50 bg-muted/10 p-4">
        <p class="text-sm font-semibold text-highlighted">iPhone / iPad (Safari)</p>
        <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Otwórz stronę w <strong class="text-highlighted">Safari</strong> (nie w Chrome).</li>
          <li>Dotknij <strong class="text-highlighted">Udostępnij</strong> (kwadrat ze strzałką).</li>
          <li>Wybierz <strong class="text-highlighted">Dodaj do ekranu początkowego</strong> → Dodaj.</li>
        </ol>
      </div>

      <div v-else-if="showAndroidManual" class="rounded-xl border border-default/50 bg-muted/10 p-4">
        <p class="text-sm font-semibold text-highlighted">Android (Chrome / Edge)</p>
        <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Użyj adresu produkcyjnego (<strong class="text-highlighted">https://</strong>), nie localhost.</li>
          <li>Menu przeglądarki (⋮) → <strong class="text-highlighted">Zainstaluj aplikację</strong> lub <strong class="text-highlighted">Dodaj do ekranu głównego</strong>.</li>
          <li>Jeśli widzisz baner u dołu ekranu — wybierz Zainstaluj.</li>
        </ol>
      </div>

      <div v-else-if="showDesktopHint" class="rounded-xl border border-default/50 bg-muted/10 p-4 text-sm text-muted">
        <p class="font-semibold text-highlighted">Komputer</p>
        <p class="mt-2">W Chrome lub Edge: ikona instalacji w pasku adresu albo menu → Zainstaluj Slavia.</p>
      </div>

      <details class="rounded-xl border border-dashed border-default/45 bg-muted/5 px-4 py-3 text-sm">
        <summary class="cursor-pointer font-medium text-highlighted">Dlaczego nie widzę przycisku?</summary>
        <ul class="mt-3 list-disc space-y-1.5 pl-5 text-muted">
          <li>Strona musi być na <strong class="text-highlighted">HTTPS</strong> (np. cksslavia.vercel.app).</li>
          <li>Na iOS instalacja działa tylko przez Safari.</li>
          <li>Jeśli PWA jest już dodana — usuń starą ikonę z ekranu głównego.</li>
          <li>W trybie incognito instalacja bywa zablokowana.</li>
        </ul>
      </details>
    </div>
  </ProfileSectionCard>
</template>

<script setup lang="ts">
defineOptions({
  name: 'ErrorPage'
})

const error = useError()

/** Runtime (router) ustawia `url`; typ `NuxtError` tego nie deklaruje. */
function errorRequestUrl(e: typeof error.value): string | undefined {
  if (!e || typeof e !== 'object') {
    return undefined
  }
  const url = (e as { url?: unknown }).url
  return typeof url === 'string' ? url : undefined
}

const errorPageUrl = computed(() => errorRequestUrl(error.value))

const fingerprint = computed(
  () =>
    `${error.value?.statusCode ?? 0}-${error.value?.statusMessage ?? ''}-${errorPageUrl.value}-${error.value?.message ?? ''}`
)

function stablePick(arr: string[], seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return arr[Math.abs(h >>> 0) % arr.length] ?? arr[0]!
}

const lines404 = [
  'Ten adres schował się za stojakiem — niestety nie ma go w naszej „wadze kategorii URL”.',
  'Spalona próba: trzy czerwone światła i ta strona nie wychodzi na podium.',
  'Wygląda na to, że link poszedł w nieuznaną — jak rwanie bez „down”.',
  'Ktoś odkręcił nakrętkę z tego URL-a i zniknął w dmuchawie łańcucha.'
]

const lines5xx = [
  'Serwer zrobił jak przy za ciężkim podejściu — techniczny timeout na sali.',
  'Backend schował się pod platformą. Oddech, reset i jeszcze jedna próba.',
  'Nasza „maszyna logów” złapała crampa — już gasimy pożar między requestami.',
  'Coś pękło mocniej niż kolano przy złym squatcie — naprawiamy po stronie serwera.'
]

const linesOther = [
  'Coś poszło nie tak między rwaniem a podrzutem — sprawdź i spróbuj ponownie.',
  'Trener techniczny kręci głową — ten request nie przeszedł walidacji jak zerowy sygnał.',
  'Ta operacja nie dostała zielonego światła od systemu.',
  'Może potrzebujesz lekkiego rozgrzewkowego odświeżenia przeglądarki?'
]

const quip = computed(() => {
  const code = error.value?.statusCode ?? 404
  const seed = fingerprint.value
  if (code === 404) {
    return stablePick(lines404, seed)
  }
  if (code >= 500) {
    return stablePick(lines5xx, seed)
  }
  return stablePick(linesOther, seed)
})

const statusLabel = computed(() => {
  const code = error.value?.statusCode ?? 404
  if (code === 404) {
    return 'Nie znaleziono strony'
  }
  if (code >= 500) {
    return 'Błąd serwera'
  }
  return 'Coś poszło nie tak'
})

function handleHome() {
  clearError({ redirect: '/' })
}

function reloadPage() {
  if (import.meta.client) {
    globalThis.location?.reload()
  }
}
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-background text-center">
    <div
      class="pointer-events-none absolute -left-24 top-16 size-[420px] rounded-full bg-primary/15 blur-3xl dark:bg-primary/25"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-32 bottom-0 size-[380px] rounded-full bg-muted blur-3xl opacity-60"
      aria-hidden="true"
    />

    <div class="relative z-1 flex flex-1 flex-col items-center justify-center px-5 py-14">
      <div class="mb-10 max-w-lg">
      <div class="slavia-deco-barbell mb-8 inline-flex items-center justify-center rounded-full bg-muted/20 px-6 py-4 ring-1 ring-default/60">
        <UIcon
          name="i-lucide-dumbbell"
          class="slavia-deco-plate text-primary size-10 sm:size-12"
        />
      </div>

      <p class="text-xs font-bold uppercase tracking-[0.28em] text-primary">
        CKS Slavia — ciężary pod kontrolą (prawie zawsze)
      </p>

      <h1 class="mt-4 text-5xl font-black tracking-tight text-highlighted sm:text-6xl">
        <span class="text-muted/40">{{ error?.statusCode ?? '?' }}</span>
      </h1>

      <p class="mt-3 text-lg font-semibold text-highlighted sm:text-xl">
        {{ statusLabel }}
      </p>

      <p class="mt-6 text-base leading-relaxed text-muted sm:text-lg">
        {{ quip }}
      </p>

      <div
        v-if="error?.statusMessage || error?.message"
        class="mt-8 rounded-2xl border border-default/70 bg-muted/15 px-5 py-4 text-left text-sm text-muted ring-1 ring-default/40 dark:bg-muted/10"
      >
        <p class="text-[11px] font-bold uppercase tracking-wider text-muted">
          Szczegóły techniczne
        </p>
        <p class="mt-2 font-mono text-xs leading-relaxed text-highlighted">
          {{ error.statusMessage || error.message }}
        </p>
        <p
          v-if="errorPageUrl"
          class="mt-2 truncate font-mono text-[11px] text-muted"
        >
          {{ errorPageUrl }}
        </p>
      </div>
      </div>

      <div class="flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
      <UButton
        size="xl"
        icon="i-lucide-home"
        class="font-bold"
        @click="handleHome"
      >
        Wróć na stronę główną
      </UButton>
      <UButton
        size="xl"
        variant="outline"
        color="neutral"
        icon="i-lucide-refresh-ccw"
        class="font-bold"
        @click="reloadPage"
      >
        Odśwież stronę
      </UButton>
      </div>

      <div class="mt-16 flex items-center gap-3 text-muted/40">
      <UIcon
        name="i-lucide-dumbbell"
        class="size-8"
      />
      <div class="h-px w-24 rounded-full bg-current" />
      <UIcon
        name="i-lucide-dumbbell"
        class="size-8"
      />
    </div>
    </div>

    <ClubSiteFooter />
  </div>
</template>

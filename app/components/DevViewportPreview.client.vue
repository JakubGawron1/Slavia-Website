<script setup lang="ts">
const DEV_LS_VIEWPORT_MODE = 'slavia-dev-viewport-mode' // off | mobile | desktop
const DEV_LS_VIEWPORT_WIDTH = 'slavia-dev-viewport-width'

const route = useRoute()

const isIframeContext = computed(() => {
  return String(route.query.__dev_iframe || '') === '1'
})

const mode = ref<'off' | 'mobile' | 'desktop'>('off')
const widthPx = ref(390)

function readStorage() {
  if (!import.meta.client) return
  const m = (localStorage.getItem(DEV_LS_VIEWPORT_MODE) || 'off').trim()
  mode.value = (m === 'mobile' || m === 'desktop') ? m : 'off'
  const wRaw = (localStorage.getItem(DEV_LS_VIEWPORT_WIDTH) || '').trim()
  const w = Number.parseInt(wRaw, 10)
  widthPx.value = Number.isFinite(w) && w > 200 ? w : (mode.value === 'desktop' ? 1280 : 390)
}

function currentUrlForFrame() {
  if (!import.meta.client) return ''
  const u = new URL(window.location.href)
  u.searchParams.set('__dev_iframe', '1')
  // w iframe nie chcemy kolejnej ramki
  return u.toString()
}

const iframeSrc = computed(() => currentUrlForFrame())

const scale = computed(() => {
  if (!import.meta.client) return 1
  const availableW = window.innerWidth - 32
  const s = availableW / Math.max(1, widthPx.value)
  return Math.min(1, Math.max(0.2, s))
})

const availableHeightCss = computed(() => {
  // `svh` lepiej zachowuje się na mobile (adres bar / UI przeglądarki).
  // Zapas na pasek „Podgląd ...” u góry.
  return 'calc(100svh - 6.5rem)'
})

/** Resztki znacznika iframe w sessionStorage (współdzielone okno rodzica + iframe) – czyść przy zamykaniu. */
function clearDevIframeSessionFlag() {
  if (!import.meta.client) return
  try {
    sessionStorage.removeItem('slavia-dev__iframe_active')
  } catch {
    /* ignore */
  }
}

function closePreview() {
  if (!import.meta.client) return
  localStorage.setItem(DEV_LS_VIEWPORT_MODE, 'off')
  mode.value = 'off'
  clearDevIframeSessionFlag()
}

const overlayOpen = computed(() => !isIframeContext.value && mode.value !== 'off' && Boolean(iframeSrc.value))

onMounted(() => {
  readStorage()
  if (!import.meta.client) return
  window.addEventListener('storage', readStorage)
  window.addEventListener('slavia-dev-viewport-changed', readStorage as EventListener)

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    // Nie przechwytuj ESC gdy otwarty jest modal lub panel edycji.
    if (document.querySelector('[data-slot="content"][data-state="open"]')) return
    if (document.querySelector('[data-slavia-editor-sheet="open"]')) return
    closePreview()
  }
  window.addEventListener('keydown', onKeyDown)

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown)
  })
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('storage', readStorage)
  window.removeEventListener('slavia-dev-viewport-changed', readStorage as EventListener)
})

watch(
  () => route.fullPath,
  () => {
    // gdy zmieni się URL, iframeSrc computed weźmie aktualny href
  }
)
</script>

<template>
  <!-- `v-if` na Teleport: unikamy pustego roota; treść ponad UApp (body). -->
  <Teleport v-if="overlayOpen" to="body">
    <div
      class="fixed inset-0 z-[470] bg-black/55 backdrop-blur-[2px]"
      role="presentation"
      @click.self="closePreview"
    >
      <div class="pointer-events-none absolute inset-x-0 top-3 z-[480] flex items-center justify-center px-3">
        <div class="pointer-events-auto flex max-w-[min(92vw,46rem)] items-center gap-2 rounded-full border border-white/10 bg-black/55 px-3 py-2 text-xs text-white shadow-lg">
          <span class="font-black uppercase tracking-wider">
            Podgląd: {{ mode === 'mobile' ? 'Mobile' : 'Desktop' }}
          </span>
          <span class="font-mono text-white/75">
            {{ widthPx }}px · skala {{ Math.round(scale * 100) }}%
          </span>
          <div class="ml-auto flex items-center gap-1">
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              icon="i-lucide-x"
              class="rounded-full"
              @click.stop="closePreview"
            >
              Zamknij
            </UButton>
          </div>
        </div>
      </div>

      <div class="absolute inset-0 z-[460] flex items-start justify-center overflow-auto p-4 pt-16">
        <div
          class="origin-top rounded-[28px] bg-black shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-1 ring-white/10"
          :style="{
            width: `${widthPx}px`,
            transform: `scale(${scale})`,
            height: `calc(${availableHeightCss} / ${scale})`
          }"
        >
          <iframe
            :src="iframeSrc"
            class="h-full w-full rounded-[28px] bg-white"
            style="border: 0;"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>


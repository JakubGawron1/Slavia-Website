<script setup lang="ts">
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({ middleware: 'auth' })

const qrEnabled = useExperimentalFlag('attendance_qr_checkin')
const apiFetch = useApi()
const toast = useToast()
const router = useRouter()

useSeoMeta({
  title: 'Skaner obecności — Panel zawodnika',
  robots: 'noindex, nofollow'
})

const sessionDate = computed(() => new Date().toISOString().slice(0, 10))
const busy = ref(false)
const lastMessage = ref<string | null>(null)
const success = ref(false)
const manualPayload = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)
const streamRef = shallowRef<MediaStream | null>(null)
const scanSupported = ref(false)

async function submitCheckin(payload: string) {
  const raw = payload.trim()
  if (!raw || busy.value) {
    return
  }
  busy.value = true
  lastMessage.value = null
  success.value = false
  try {
    await apiFetch(apiRoutes.attendance.qrCheckin, {
      method: 'POST',
      body: { payload: raw, session_date: sessionDate.value }
    })
    success.value = true
    lastMessage.value = `Obecność zapisana na ${sessionDate.value}`
    toast.add({ title: 'Zatwierdzono obecność', color: 'success' })
    setTimeout(() => router.push('/attendance'), 1500)
  } catch (e) {
    const msg = getApiErrorMessage(e)
    lastMessage.value = msg
    toast.add({ title: 'Nie udało się zapisać obecności', description: msg, color: 'error' })
  } finally {
    busy.value = false
  }
}

function stopCamera() {
  streamRef.value?.getTracks().forEach(t => t.stop())
  streamRef.value = null
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

async function startCameraScan() {
  if (!import.meta.client) {
    return
  }
  // BarcodeDetector — eksperymentalne API Chromium / Safari (iOS 17+)
  const Detector = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => { detect: (src: ImageBitmapSource) => Promise<{ rawValue?: string }[]> } }).BarcodeDetector
  if (!Detector || !navigator.mediaDevices?.getUserMedia) {
    scanSupported.value = false
    return
  }
  scanSupported.value = true
  stopCamera()
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    })
    streamRef.value = stream
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      await videoRef.value.play()
    }
    const detector = new Detector({ formats: ['qr_code'] })
    const tick = async () => {
      if (!videoRef.value || !streamRef.value || busy.value) {
        return
      }
      try {
        const codes = await detector.detect(videoRef.value)
        const raw = codes[0]?.rawValue?.trim()
        if (raw) {
          await submitCheckin(raw)
          return
        }
      } catch {
        /* kolejna klatka */
      }
      if (streamRef.value) {
        requestAnimationFrame(() => { void tick() })
      }
    }
    void tick()
  } catch {
    scanSupported.value = false
    toast.add({
      title: 'Brak dostępu do kamery',
      description: 'Wpisz kod ręcznie lub użyj aplikacji mobilnej.',
      color: 'warning'
    })
  }
}

onMounted(() => {
  if (qrEnabled.value) {
    void startCameraScan()
  }
})

onBeforeUnmount(() => {
  stopCamera()
})
</script>

<template>
  <PanelPageLayout>
    <PanelPageHeader area="athlete" title="Skaner obecności" icon="i-lucide-qr-code">
      <template #description>
        Skieruj kamerę na kod QR w sali. Data treningu: <strong>{{ sessionDate }}</strong>.
      </template>
    </PanelPageHeader>

    <UAlert
      v-if="!qrEnabled"
      color="warning"
      variant="subtle"
      icon="i-lucide-flask-conical"
      title="Funkcja wyłączona"
      description="Włącz flagę „Obecność: kod QR” w ustawieniach developera lub poproś kadrę o włączenie."
      class="mb-4 rounded-2xl"
    />

    <template v-else>
      <UCard class="rounded-2xl border-default/70 overflow-hidden">
        <div v-if="scanSupported" class="relative aspect-4/3 bg-black">
          <video ref="videoRef" class="size-full object-cover" playsinline muted />
          <div class="pointer-events-none absolute inset-8 rounded-xl border-2 border-primary/70" />
        </div>
        <p v-else class="p-4 text-sm text-muted">
          Przeglądarka nie obsługuje skanera QR — wklej treść kodu poniżej (np. z aplikacji aparatu).
        </p>
      </UCard>

      <UCard class="mt-4 rounded-2xl border-default/70 p-4">
        <UFormField label="Kod QR (ręcznie)">
          <UTextarea v-model="manualPayload" :rows="3" placeholder="SLAVIA-ATT:v1:…" class="w-full font-mono text-sm" />
        </UFormField>
        <div class="mt-3 flex flex-wrap gap-2">
          <UButton color="primary" icon="i-lucide-check" :loading="busy" @click="submitCheckin(manualPayload)">
            Zapisz obecność
          </UButton>
          <UButton variant="ghost" to="/attendance">
            Moja obecność
          </UButton>
        </div>
      </UCard>

      <p
        v-if="lastMessage"
        class="mt-4 text-center text-sm font-semibold"
        :class="success ? 'text-primary' : 'text-error'"
      >
        {{ lastMessage }}
      </p>
    </template>
  </PanelPageLayout>
</template>

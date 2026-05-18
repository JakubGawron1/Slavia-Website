<script setup lang="ts">
import { Html5Qrcode } from 'html5-qrcode'
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

const SCANNER_ID = 'slavia-attendance-qr-reader'

const sessionDate = computed(() => new Date().toISOString().slice(0, 10))
const busy = ref(false)
const lastMessage = ref<string | null>(null)
const success = ref(false)
const manualPayload = ref('')
const scanActive = ref(false)
const scanError = ref<string | null>(null)
let html5Qr: Html5Qrcode | null = null

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
    await stopCameraScan()
    setTimeout(() => router.push('/attendance'), 1500)
  } catch (e) {
    const msg = getApiErrorMessage(e)
    lastMessage.value = msg
    toast.add({ title: 'Nie udało się zapisać obecności', description: msg, color: 'error' })
  } finally {
    busy.value = false
  }
}

async function stopCameraScan() {
  scanActive.value = false
  if (!html5Qr) {
    return
  }
  try {
    if (html5Qr.isScanning) {
      await html5Qr.stop()
    }
    html5Qr.clear()
  } catch {
    /* ignore */
  }
  html5Qr = null
}

async function startCameraScan() {
  if (!import.meta.client || !qrEnabled.value || scanActive.value) {
    return
  }
  scanError.value = null
  await stopCameraScan()
  await nextTick()

  if (!navigator.mediaDevices?.getUserMedia) {
    scanError.value = 'Ta przeglądarka nie obsługuje kamery — użyj pola ręcznego lub aplikacji mobilnej.'
    return
  }

  try {
    html5Qr = new Html5Qrcode(SCANNER_ID)
    await html5Qr.start(
      { facingMode: 'environment' },
      { fps: 8, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
      (decodedText) => {
        void submitCheckin(decodedText)
      },
      () => {
        /* brak kodu w klatce — normalne */
      }
    )
    scanActive.value = true
  } catch (e) {
    scanError.value = getApiErrorMessage(e) || 'Brak dostępu do kamery'
    toast.add({
      title: 'Nie udało się uruchomić kamery',
      description: 'Zezwól na kamerę w przeglądarce lub wpisz kod ręcznie.',
      color: 'warning'
    })
  }
}

watch(
  qrEnabled,
  async (on) => {
    if (on) {
      await nextTick()
      await startCameraScan()
    } else {
      await stopCameraScan()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  void stopCameraScan()
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
      <UCard class="overflow-hidden rounded-2xl border-default/70">
        <div
          :id="SCANNER_ID"
          class="relative min-h-[280px] bg-black sm:min-h-[320px]"
        />
        <div class="flex flex-wrap gap-2 border-t border-default/50 p-3">
          <UButton
            v-if="!scanActive"
            color="primary"
            icon="i-lucide-camera"
            :loading="busy"
            @click="startCameraScan"
          >
            Włącz kamerę
          </UButton>
          <UButton
            v-else
            variant="outline"
            color="neutral"
            icon="i-lucide-camera-off"
            @click="stopCameraScan"
          >
            Wyłącz kamerę
          </UButton>
        </div>
        <p v-if="scanError" class="px-4 pb-4 text-sm text-warning">
          {{ scanError }}
        </p>
        <p v-else-if="!scanActive" class="px-4 pb-4 text-sm text-muted">
          Jeśli kamera nie startuje sama, naciśnij „Włącz kamerę”. Wymagane HTTPS i zgoda na dostęp do aparatu.
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

<script setup lang="ts">
import { Html5Qrcode } from 'html5-qrcode'
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

const props = withDefaults(defineProps<{
  /** Po sukcesie — domyślnie zostajemy na stronie (hub obecności). */
  redirectOnSuccess?: boolean
}>(), {
  redirectOnSuccess: false
})

const qrEnabled = useExperimentalFlag('attendance_qr_checkin')
const apiFetch = useApi()
const toast = useToast()
const router = useRouter()

const SCANNER_ID = 'slavia-attendance-qr-reader-hub'

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
  if (!raw || busy.value) return
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
    if (props.redirectOnSuccess) {
      setTimeout(() => router.push('/klub/obecnosc'), 1500)
    }
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
  if (!html5Qr) return
  try {
    if (html5Qr.isScanning) await html5Qr.stop()
    html5Qr.clear()
  } catch { /* ignore */ }
  html5Qr = null
}

async function startCameraScan() {
  if (!import.meta.client || !qrEnabled.value || scanActive.value) return
  scanError.value = null
  await stopCameraScan()
  await nextTick()
  if (!navigator.mediaDevices?.getUserMedia) {
    scanError.value = 'Przeglądarka nie obsługuje kamery — wpisz kod ręcznie.'
    return
  }
  try {
    html5Qr = new Html5Qrcode(SCANNER_ID)
    await html5Qr.start(
      { facingMode: 'environment' },
      { fps: 8, qrbox: { width: 220, height: 220 } },
      (decoded) => { void submitCheckin(decoded) },
      () => {}
    )
    scanActive.value = true
  } catch {
    scanError.value = 'Nie udało się uruchomić kamery. Sprawdź uprawnienia (HTTPS).'
    toast.add({
      title: 'Nie udało się uruchomić kamery',
      description: 'Zezwól na kamerę lub wpisz kod ręcznie.',
      color: 'warning'
    })
  }
}

const shouldAutoStart = ref(false)

watch(
  qrEnabled,
  async (on) => {
    if (on && shouldAutoStart.value) {
      await nextTick()
      await startCameraScan()
    } else {
      await stopCameraScan()
    }
  }
)

onMounted(() => {
  shouldAutoStart.value = true
  if (qrEnabled.value) void startCameraScan()
})

onBeforeUnmount(() => {
  void stopCameraScan()
})

defineExpose({ startCameraScan, stopCameraScan })
</script>

<template>
  <UAlert
    v-if="!qrEnabled"
    color="warning"
    variant="subtle"
    icon="i-lucide-flask-conical"
    title="Skaner QR wyłączony"
    description="Włącz flagę „Obecność: kod QR” w panelu developera."
    class="rounded-2xl"
  />

  <template v-else>
    <UCard class="overflow-hidden rounded-2xl border-default/70">
      <div class="relative min-h-[260px] bg-black sm:min-h-[300px]">
        <div :id="SCANNER_ID" class="absolute inset-0" />
        <div
          class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6"
          aria-hidden="true"
        >
          <div class="relative size-[min(72vw,14rem)] rounded-2xl border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            <span class="absolute -left-0.5 -top-0.5 size-7 rounded-tl-lg border-l-4 border-t-4 border-primary" />
            <span class="absolute -right-0.5 -top-0.5 size-7 rounded-tr-lg border-r-4 border-t-4 border-primary" />
            <span class="absolute -bottom-0.5 -left-0.5 size-7 rounded-bl-lg border-b-4 border-l-4 border-primary" />
            <span class="absolute -bottom-0.5 -right-0.5 size-7 rounded-br-lg border-b-4 border-r-4 border-primary" />
          </div>
        </div>
        <p class="pointer-events-none absolute inset-x-0 bottom-3 z-10 text-center text-xs font-medium text-white/90">
          Umieść kod QR w ramce · {{ sessionDate }}
        </p>
      </div>
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
      <p v-if="scanError" class="px-4 pb-3 text-sm text-warning">{{ scanError }}</p>
    </UCard>

    <UCard class="mt-4 rounded-2xl border-default/70 p-4">
      <UFormField label="Kod QR (ręcznie)">
        <UTextarea
          v-model="manualPayload"
          :rows="2"
          placeholder="SLAVIA-ATT:v1:…"
          class="w-full font-mono text-sm"
        />
      </UFormField>
      <UButton
        class="mt-3"
        color="primary"
        icon="i-lucide-check"
        :loading="busy"
        @click="submitCheckin(manualPayload)"
      >
        Zapisz obecność
      </UButton>
    </UCard>

    <p
      v-if="lastMessage"
      class="mt-3 text-center text-sm font-semibold"
      :class="success ? 'text-success' : 'text-error'"
    >
      {{ lastMessage }}
    </p>
  </template>
</template>

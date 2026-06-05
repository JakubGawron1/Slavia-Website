<script setup lang="ts">
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'

const qrEnabled = useExperimentalFlag('attendance_qr_checkin')

type QrConfig = {
  token: string
  payload: string
  club_label: string
}

const api = useApi()
const toast = useToast()
const config = ref<QrConfig | null>(null)
const loading = ref(false)
const regenerating = ref(false)
const qrDataUrl = ref('')

async function loadConfig() {
  loading.value = true
  try {
    config.value = await api<QrConfig>(apiRoutes.attendance.qrConfig)
    await renderQr()
  } catch (e) {
    toast.add({
      title: 'Nie udało się wczytać kodu QR',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function renderQr() {
  if (!config.value?.payload) {
    qrDataUrl.value = ''
    return
  }
  if (!import.meta.client) return
  try {
    const QRCode = await import('qrcode')
    qrDataUrl.value = await QRCode.toDataURL(config.value.payload, {
      margin: 2,
      width: 280,
      errorCorrectionLevel: 'M'
    })
  } catch {
    qrDataUrl.value = ''
  }
}

async function regenerate() {
  if (!confirm('Wygenerować nowy kod QR? Stary przestanie działać na wydrukach.')) return
  regenerating.value = true
  try {
    config.value = await api<QrConfig>(apiRoutes.attendance.qrRegenerate, { method: 'POST' })
    await renderQr()
    toast.add({ title: 'Nowy kod QR', color: 'success' })
  } catch (e) {
    toast.add({
      title: 'Nie udało się wygenerować',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    regenerating.value = false
  }
}

function printQr() {
  if (!import.meta.client) return
  const w = window.open('', '_blank', 'width=480,height=640')
  if (!w || !qrDataUrl.value) return
  const label = config.value?.club_label ?? 'Obecność — CKS Slavia'
  const html = [
    '<!DOCTYPE html><html><head><title>',
    label,
    '</title><style>body{font-family:system-ui,sans-serif;text-align:center;padding:24px}',
    'img{width:280px;height:280px}p{color:#444;font-size:14px}</style></head><body>',
    '<h1>',
    label,
    '</h1><img src="',
    qrDataUrl.value,
    '" alt="QR obecności" />',
    '<p>Zeskanuj w aplikacji Slavia (zawodnik → skaner obecności). Kod nie wygasa.</p>',
    '</body></html>'
  ].join('')
  w.document.write(html)
  w.document.close()
  w.onload = () => {
    w.print()
  }
}

onMounted(() => {
  void loadConfig()
})
</script>

<template>
  <UCard v-if="qrEnabled" class="slavia-page-card mb-6 border-primary/20 bg-primary/5">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Weryfikacja QR
        </p>
        <h2 class="mt-1 text-lg font-black text-highlighted">
          Stały kod obecności na sali
        </h2>
        <p class="mt-1 text-sm text-muted">
          Zawodnik skanuje w aplikacji mobilnej — obecność trafia od razu jako zatwierdzona.
          Kod nie wygasa; możesz go wydrukować lub wygenerować ponownie po wycieku.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <UButton
            size="sm"
            variant="soft"
            icon="i-lucide-refresh-cw"
            :loading="regenerating"
            @click="regenerate"
          >
            Nowy kod
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            icon="i-lucide-printer"
            :disabled="!qrDataUrl"
            @click="printQr"
          >
            Drukuj
          </UButton>
        </div>
      </div>

      <div
        v-if="loading"
        class="flex size-[280px] items-center justify-center rounded-2xl border border-dashed border-default bg-card/80"
      >
        <UIcon name="i-lucide-loader-2" class="size-10 animate-spin text-primary" />
      </div>
      <img
        v-else-if="qrDataUrl"
        :src="qrDataUrl"
        alt="Kod QR obecności klubu"
        class="size-[280px] rounded-2xl border border-default bg-white p-3 shadow-lg"
        width="280"
        height="280"
      >
    </div>
  </UCard>
</template>

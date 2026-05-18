<script setup lang="ts">
import { apiRoutes } from '~/config/api'
import { getApiErrorMessage } from '~/composables/useApi'
import type { Athlete } from '~/types/models'
import { resolveAuthProfilePhotoSrc } from '~/utils/profilePhoto'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Ustawienia konta — Slavia',
  robots: 'noindex, nofollow'
})

const auth = useAuth()
const apiFetch = useApi()
const toast = useToast()
const { preset, presets, setPreset, colorMode } = useSlaviaAppearance()
const { mobileRelease, mobileDownloadHref, mobileDownloadLabel } = useMobileAppRelease()
const athlete = ref<Athlete | null>(null)
const athleteLoading = ref(false)

const form = reactive({
  avatar_url: '',
  newPassword: '',
  confirmPassword: '',
  birth_year: null as number | null,
  gender: 'male' as 'male' | 'female' | null
})

watch(
  () => auth.user.value,
  (u) => {
    if (!u) {
      return
    }
    /** Wpis w formularzu: jawny avatar konta lub — jak pusty — zdjęcie z profilu zawodnika (`/me`). */
    form.avatar_url = u.avatar_url?.trim() || u.athlete_image_url?.trim() || ''
    if (u.roles.includes('Athlete')) {
      fetchAthleteProfile()
    }
  },
  { immediate: true }
)

async function fetchAthleteProfile() {
  athleteLoading.value = true
  try {
    const res = await apiFetch<Athlete>('/api/athletes/me')
    athlete.value = res
    form.birth_year = res.birth_year ?? null
    form.gender = res.gender === 'female' ? 'female' : 'male'
  } catch (err) {
    console.error('Failed to fetch athlete profile', err)
  } finally {
    athleteLoading.value = false
  }
}

/** Podgląd — ta sama kolejność co navbar: wpis w formularzu, potem `resolveAuthProfilePhotoSrc`. */
const profileAvatarSrc = computed(() => {
  const typed = form.avatar_url?.trim()
  if (typed) return typed
  return resolveAuthProfilePhotoSrc(auth.user.value ?? undefined) || ''
})

const avatarBroken = ref(false)

watch(profileAvatarSrc, () => {
  avatarBroken.value = false
})

const saving = ref(false)
const uploadLoading = ref(false)
const avatarFileInput = ref<HTMLInputElement | null>(null)

function resetForm() {
  const u = auth.user.value
  if (!u) {
    return
  }
  form.avatar_url = u.avatar_url?.trim() || u.athlete_image_url?.trim() || ''
  form.newPassword = ''
  form.confirmPassword = ''
  if (athlete.value) {
    form.birth_year = athlete.value.birth_year ?? null
    form.gender = athlete.value.gender === 'female' ? 'female' : 'male'
  }
  avatarBroken.value = false
}

async function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !file.type.startsWith('image/')) {
    toast.add({ title: 'Wybierz plik graficzny', color: 'warning' })
    return
  }
  uploadLoading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('purpose', 'avatar')
    const res = await apiFetch<{ url: string }>('/api/upload', { method: 'POST', body: fd })
    const url = (res.url || '').trim()
    if (!url) {
      toast.add({ title: 'Serwer nie zwrócił adresu obrazka', color: 'warning' })
      return
    }
    form.avatar_url = url
    await persistAvatarToAccount(url)
    toast.add({ title: 'Zdjęcie wgrane i zapisane na koncie', color: 'success' })
  } catch (err) {
    toast.add({
      title: 'Upload nie powiódł się',
      description: getApiErrorMessage(err),
      color: 'error'
    })
  } finally {
    uploadLoading.value = false
  }
}

const totpSetupLoading = ref(false)
const totpSecret = ref('')
const totpUri = ref('')
const totpEnableCode = ref('')
const totpDisablePassword = ref('')
const showTotpSetup = ref(false)

const PAY_REMINDER_LS = 'slavia_hide_payment_reminder'
const hidePaymentReminder = ref(false)

onMounted(() => {
  if (auth.token.value) {
    auth.fetchMe()
  }
  try {
    hidePaymentReminder.value = localStorage.getItem(PAY_REMINDER_LS) === '1'
  } catch {
    /* ignore */
  }
})

watch(hidePaymentReminder, (v) => {
  if (!import.meta.client) return
  try {
    if (v) localStorage.setItem(PAY_REMINDER_LS, '1')
    else localStorage.removeItem(PAY_REMINDER_LS)
  } catch {
    /* ignore */
  }
})

async function startTotpSetup() {
  totpSetupLoading.value = true
  try {
    const r = await apiFetch<{ secret_base32: string, otpauth_uri: string }>(apiRoutes.auth.totpSetup, {
      method: 'POST'
    })
    totpSecret.value = r.secret_base32
    totpUri.value = r.otpauth_uri
    showTotpSetup.value = true
    totpEnableCode.value = ''
  } catch (e) {
    toast.add({
      title: 'Nie udało się przygotować 2FA',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    totpSetupLoading.value = false
  }
}

async function enableTotp() {
  try {
    await apiFetch(apiRoutes.auth.totpEnable, {
      method: 'POST',
      body: { code: totpEnableCode.value.trim() }
    })
    toast.add({ title: 'Dwuskładnikowe logowanie włączone', color: 'success' })
    showTotpSetup.value = false
    totpEnableCode.value = ''
    totpSecret.value = ''
    totpUri.value = ''
    await auth.fetchMe()
  } catch (e) {
    toast.add({
      title: 'Nieprawidłowy kod lub błąd serwera',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

async function disableTotp() {
  try {
    await apiFetch(apiRoutes.auth.totpDisable, {
      method: 'POST',
      body: { password: totpDisablePassword.value }
    })
    toast.add({ title: '2FA wyłączone', color: 'success' })
    totpDisablePassword.value = ''
    showTotpSetup.value = false
    totpSecret.value = ''
    totpUri.value = ''
    await auth.fetchMe()
  } catch (e) {
    toast.add({
      title: 'Nie udało się wyłączyć 2FA',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  }
}

const logoutAllLoading = ref(false)

async function logoutFromAllDevices() {
  if (!confirm('Czy na pewno chcesz wylogować się ze wszystkich urządzeń? Będziesz musiał zalogować się ponownie na tym urządzeniu.')) {
    return
  }
  logoutAllLoading.value = true
  try {
    await apiFetch(apiRoutes.auth.logoutAll, { method: 'POST' })
    toast.add({ title: 'Wylogowano ze wszystkich urządzeń', color: 'success' })
    auth.logout()
    navigateTo('/logowanie')
  } catch (e) {
    toast.add({
      title: 'Błąd wylogowywania',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    logoutAllLoading.value = false
  }
}

/** Zapis `users.avatar_url` w backendzie (sam upload na Cloudinary tego nie robi). */
async function persistAvatarToAccount(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return
  await apiFetch('/api/auth/profile', {
    method: 'PATCH',
    body: { avatar_url: trimmed }
  })
  await auth.fetchMe()
}

const dashboardLink = computed(() => {
  if (auth.isSuperAdmin.value) return '/superadmin'
  if (auth.isAdmin.value) return '/admin'
  if (auth.isTrainer.value) return '/trainer'
  if (auth.isAthlete.value) return '/athlete'
  return '/'
})

async function save() {
  if (form.newPassword && form.newPassword !== form.confirmPassword) {
    toast.add({ title: 'Hasła się nie zgadzają', color: 'warning' })
    return
  }
  saving.value = true
  try {
    const payload: Record<string, string> = {}
    const av = form.avatar_url.trim()
    payload.avatar_url = av
    const pw = form.newPassword.trim()
    if (pw) {
      payload.password = pw
    }
    await apiFetch('/api/auth/profile', { method: 'PATCH', body: payload })

    if (auth.user.value?.roles.includes('Athlete')) {
      await apiFetch('/api/athletes/me', {
        method: 'PATCH',
        body: {
          birth_year: form.birth_year,
          gender: form.gender
        }
      })
      await fetchAthleteProfile()
    }

    await auth.fetchMe()
    form.newPassword = ''
    form.confirmPassword = ''
    toast.add({ title: 'Konto zaktualizowane', color: 'success' })
  } catch (e) {
    toast.add({
      title: 'Nie udało się zapisać',
      description: getApiErrorMessage(e),
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="relative min-h-svh overflow-x-clip pb-28 sm:pb-10 md:pb-14">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(42vh,26rem)] bg-linear-to-b from-primary/9 via-muted/35 to-transparent dark:from-primary/6 dark:via-muted/20"
    />

    <UContainer class="relative z-1 mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-10 md:max-w-5xl md:py-12 lg:max-w-6xl xl:max-w-[1180px]">
      <!-- Desktop: nagłówek -->
      <div class="mb-8 hidden rounded-2xl border border-default/40 bg-card/80 px-6 py-5 shadow-sm ring-1 ring-default/25 backdrop-blur-sm md:flex md:items-start md:justify-between md:gap-6 lg:mb-10">
        <div class="min-w-0">
          <p class="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            Konto Slavia
          </p>
          <h1 class="mt-1.5 text-2xl font-bold tracking-tight text-highlighted lg:text-3xl">
            Ustawienia konta
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Profil, instalacja PWA i aplikacji Android, motyw klubu, hasło oraz 2FA. Login zmienia administrator.
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-rotate-ccw" @click="resetForm">
            Przywróć
          </UButton>
          <UButton :loading="saving" color="primary" size="sm" icon="i-lucide-save" class="font-semibold shadow-sm" @click="save">
            Zapisz
          </UButton>
        </div>
      </div>

      <!-- Mobile: nagłówek -->
      <div class="mb-6 md:hidden">
        <p class="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
          Konto
        </p>
        <h1 class="mt-1 text-xl font-bold tracking-tight text-highlighted">
          Ustawienia
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-muted">
          Profil, PWA na ekranie głównym, APK Android i bezpieczeństwo konta.
        </p>
      </div>

      <!-- Mobile: pas profilu -->
      <div class="mb-6 flex flex-col gap-4 md:hidden">
        <div class="flex min-w-0 items-center gap-4 rounded-2xl border border-default/45 bg-card p-4 shadow-sm ring-1 ring-default/25">
          <UAvatar
            :src="profileAvatarSrc && !avatarBroken ? profileAvatarSrc : undefined"
            :alt="auth.user.value?.username"
            size="xl"
            class="size-[3.65rem] ring-2 ring-default/35"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-base font-semibold text-highlighted">
              {{ auth.user.value?.username }}
            </p>
            <p v-if="auth.rolesDisplayShort" class="truncate text-xs text-muted">
              {{ auth.rolesDisplayShort }}
            </p>
            <nav class="mt-3 flex flex-wrap gap-1.5 text-xs">
              <a href="#aplikacje" class="rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1.5 font-medium text-primary">PWA</a>
              <a href="#wyglad" class="rounded-lg border border-default/50 px-2.5 py-1.5 text-muted">Wygląd</a>
              <a href="#bezpieczenstwo" class="rounded-lg border border-default/50 px-2.5 py-1.5 text-muted">2FA</a>
            </nav>
            <nav class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
              <UButton :to="dashboardLink" variant="soft" color="primary" size="xs" icon="i-lucide-layout-dashboard" class="min-h-8">
                Panel
              </UButton>
              <UButton to="/" variant="outline" color="neutral" size="xs" icon="i-lucide-home" class="min-h-8">
                Klub
              </UButton>
              <UButton
                v-if="auth.isSuperAdmin"
                to="/superadmin/developer"
                variant="outline"
                color="neutral"
                size="xs"
                icon="i-lucide-wrench"
                class="min-h-8"
              >
                Dev
              </UButton>
            </nav>
          </div>
        </div>
      </div>

      <div class="md:grid md:grid-cols-12 md:items-start md:gap-8 lg:gap-10 xl:gap-12">
        <aside class="relative mb-0 hidden md:col-span-5 lg:col-span-4 md:block lg:sticky lg:top-[calc(4.75rem+env(safe-area-inset-top))] lg:max-w-sm lg:self-start">
          <div class="space-y-5 rounded-2xl border border-default/45 bg-card/95 p-6 shadow-sm ring-1 ring-default/25 backdrop-blur-sm">
            <div class="flex flex-col items-center text-center">
              <UAvatar
                :src="profileAvatarSrc && !avatarBroken ? profileAvatarSrc : undefined"
                :alt="auth.user.value?.username"
                size="xl"
                class="size-23 ring-4 ring-primary/15 ring-offset-4 ring-offset-card lg:size-27"
              />
              <p class="mt-4 truncate text-lg font-bold text-highlighted">
                {{ auth.user.value?.username }}
              </p>
              <p v-if="auth.rolesDisplayShort" class="mt-1 max-w-full truncate rounded-full border border-default/40 bg-muted/25 px-3 py-1 text-[11px] font-medium text-muted">
                {{ auth.rolesDisplayShort }}
              </p>
            </div>
            <nav class="flex flex-col gap-1.5 border-b border-default/40 pb-5 text-sm">
              <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                Na tej stronie
              </p>
              <a href="#profil" class="rounded-lg px-3 py-2 text-muted transition hover:bg-muted/20 hover:text-highlighted">Profil i awatar</a>
              <a href="#aplikacje" class="rounded-lg px-3 py-2 text-muted transition hover:bg-muted/20 hover:text-highlighted">Aplikacje (PWA + APK)</a>
              <a href="#wyglad" class="rounded-lg px-3 py-2 text-muted transition hover:bg-muted/20 hover:text-highlighted">Wygląd</a>
              <a href="#konto" class="rounded-lg px-3 py-2 text-muted transition hover:bg-muted/20 hover:text-highlighted">Hasło</a>
              <a href="#bezpieczenstwo" class="rounded-lg px-3 py-2 text-muted transition hover:bg-muted/20 hover:text-highlighted">Bezpieczeństwo</a>
            </nav>
            <nav class="flex flex-col gap-2 pt-5">
              <UButton :to="dashboardLink" variant="soft" color="primary" block size="md" icon="i-lucide-layout-dashboard" class="justify-center font-semibold">
                Mój panel
              </UButton>
              <UButton to="/" variant="outline" color="neutral" block size="md" icon="i-lucide-home" class="justify-center">
                Strona klubu
              </UButton>
              <UButton
                v-if="auth.isSuperAdmin"
                to="/superadmin/developer"
                variant="outline"
                color="neutral"
                block
                icon="i-lucide-wrench"
                size="md"
                class="justify-center"
              >
                Narzędzia deweloperskie
              </UButton>
            </nav>
            <div class="border-t border-default/40 pt-5">
              <p class="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted">
                Szablony przycisków
              </p>
              <div class="flex flex-col gap-2">
                <UButton variant="outline" color="neutral" block icon="i-lucide-rotate-ccw" @click="resetForm">
                  Cofnij edycję
                </UButton>
                <UButton :loading="saving" color="primary" block icon="i-lucide-save" class="font-semibold shadow-sm" @click="save">
                  Zapisz konto
                </UButton>
              </div>
            </div>
          </div>
        </aside>

        <div class="min-w-0 md:col-span-7 lg:col-span-8">
          <div class="flex flex-col gap-8 md:gap-10">
            <div id="profil" class="scroll-mt-28">
              <p class="mb-5 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Profil</p>
            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 class="text-base font-bold text-highlighted">
                    Zdjęcie profilowe
                  </h2>
                  <p class="mt-1 text-sm leading-relaxed text-muted">
                    Wgranie pliku zapisuje od razu URL na koncie. Możesz też wkleić link — wtedy „Zapisz” na dole lub w panelu obok.
                  </p>
                </div>
                <UBadge variant="soft" color="neutral" size="xs" class="shrink-0 font-mono uppercase tracking-wide">
                  Cloudinary
                </UBadge>
              </div>
              <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                <input
                  ref="avatarFileInput"
                  type="file"
                  accept="image/*"
                  class="sr-only"
                  @change="onAvatarFileChange"
                >
                <UButton
                  color="primary"
                  variant="outline"
                  icon="i-lucide-upload"
                  size="md"
                  class="shrink-0 justify-center font-medium sm:w-auto"
                  :loading="uploadLoading"
                  @click="avatarFileInput?.click()"
                >
                  Wybierz plik
                </UButton>
                <UFormField label="URL obrazka" class="min-w-0 flex-1" :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }">
                  <UInput
                    v-model="form.avatar_url"
                    type="url"
                    placeholder="https://…"
                    size="md"
                    class="font-mono text-sm"
                  />
                </UFormField>
              </div>
            </section>

            <section v-if="auth.isAthlete.value" class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">
              <h2 class="text-base font-bold text-highlighted">
                Dane zawodnika
              </h2>
              <p class="mt-1 text-sm leading-relaxed text-muted">
                Płeć i rok urodzenia są niezbędne do poprawnego wyliczania punktów Sinclair i Meltzer-Faber.
              </p>
              <div class="mt-5 grid gap-4 sm:grid-cols-2">
                <UFormField label="Płeć" :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }">
                  <URadioGroup
                    v-model="form.gender"
                    :options="[
                      { value: 'male', label: 'Mężczyzna' },
                      { value: 'female', label: 'Kobieta' }
                    ]"
                  />
                </UFormField>
                <UFormField label="Rok urodzenia" :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }">
                  <UInput
                    v-model="form.birth_year"
                    type="number"
                    placeholder="np. 2005"
                    size="md"
                  />
                </UFormField>
              </div>
            </section>
            </div>

            <div id="wyglad" class="scroll-mt-28 space-y-5 md:space-y-6">
              <p class="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Wygląd</p>
            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">
              <h2 class="text-base font-bold text-highlighted">
                Motyw i tryb ekranu
              </h2>
              <p class="mt-1 text-sm leading-relaxed text-muted">
                Tryb ekranu i motyw z tokenów klubu — automatycznie dopasuje się także w Black gym i innych presetach.
              </p>
              <div class="mt-5 space-y-6">
                <UFormField label="Tryb" :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }">
                  <div class="inline-flex rounded-xl border border-default/55 bg-muted/20 p-1">
                    <UButton
                      size="sm"
                      :variant="colorMode.preference === 'light' ? 'solid' : 'ghost'"
                      :color="colorMode.preference === 'light' ? 'primary' : 'neutral'"
                      icon="i-lucide-sun"
                      class="rounded-lg"
                      @click="colorMode.preference = 'light'"
                    >
                      Jasny
                    </UButton>
                    <UButton
                      size="sm"
                      :variant="colorMode.preference === 'dark' ? 'solid' : 'ghost'"
                      :color="colorMode.preference === 'dark' ? 'primary' : 'neutral'"
                      icon="i-lucide-moon"
                      class="rounded-lg"
                      @click="colorMode.preference = 'dark'"
                    >
                      Ciemny
                    </UButton>
                    <UButton
                      size="sm"
                      :variant="colorMode.preference === 'system' ? 'solid' : 'ghost'"
                      :color="colorMode.preference === 'system' ? 'primary' : 'neutral'"
                      icon="i-lucide-monitor"
                      class="rounded-lg"
                      @click="colorMode.preference = 'system'"
                    >
                      System
                    </UButton>
                  </div>
                </UFormField>

                <UFormField label="Motyw kolorystyczny" :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }">
                  <div class="grid max-h-[min(52vh,28rem)] grid-cols-1 gap-2.5 overflow-y-auto pr-1 sm:max-h-none sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
                    <button
                      v-for="p in presets"
                      :key="p.id"
                      type="button"
                      class="rounded-xl border px-4 py-3.5 text-left text-sm outline-none ring-offset-2 ring-offset-card transition-all focus-visible:ring-2 focus-visible:ring-primary"
                      :class="
                        preset === p.id
                          ? 'border-primary/55 bg-primary/10 text-highlighted shadow-inner ring-1 ring-primary/30'
                          : 'border-default/55 bg-muted/15 text-muted hover:border-default hover:bg-muted/25 hover:text-highlighted'
                      "
                      @click="setPreset(p.id)"
                    >
                      <span class="font-semibold text-highlighted">{{ p.label }}</span>
                      <span class="mt-1 block text-xs leading-snug text-muted">{{ p.description }}</span>
                    </button>
                  </div>
                </UFormField>
              </div>
            </section>

            </div>

            <div id="aplikacje" class="scroll-mt-28 space-y-5 md:space-y-6">
              <p class="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                Aplikacje
              </p>
              <ProfilePwaInstall />

            <section
              v-if="mobileDownloadHref"
              class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 class="text-base font-bold text-highlighted">
                    Aplikacja mobilna
                  </h2>
                  <p class="mt-1 text-sm leading-relaxed text-muted">
                    Oficjalna aplikacja CKS Slavia na Androida (APK z GitHub Releases). Na iOS otworzysz stronę wydania w przeglądarce.
                  </p>
                  <p
                    v-if="mobileRelease?.tagName || mobileRelease?.name"
                    class="mt-2 text-xs font-medium text-muted"
                  >
                    <span v-if="mobileRelease?.tagName" class="font-mono">{{ mobileRelease.tagName }}</span>
                    <span v-if="mobileRelease?.tagName && mobileRelease?.name"> · </span>
                    <span v-if="mobileRelease?.name">{{ mobileRelease.name }}</span>
                  </p>
                </div>
                <UBadge variant="soft" color="success" size="xs" class="shrink-0 uppercase tracking-wide">
                  Android
                </UBadge>
              </div>
              <div class="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <UButton
                  :to="mobileDownloadHref"
                  external
                  target="_blank"
                  rel="noopener noreferrer"
                  color="success"
                  variant="solid"
                  size="md"
                  icon="i-lucide-download"
                  class="w-full justify-center font-semibold sm:w-auto"
                >
                  {{ mobileDownloadLabel }}
                </UButton>
                <UButton
                  v-if="mobileRelease?.htmlUrl"
                  :to="mobileRelease.htmlUrl"
                  external
                  target="_blank"
                  rel="noopener noreferrer"
                  color="neutral"
                  variant="outline"
                  size="md"
                  icon="i-lucide-github"
                  class="w-full justify-center sm:w-auto"
                >
                  Zobacz wydanie na GitHubie
                </UButton>
              </div>

              <div class="mt-6 rounded-xl border border-dashed border-default/45 bg-muted/10 p-4 ring-1 ring-default/15">
                <h3 class="text-sm font-semibold text-highlighted">
                  Changelog aplikacji mobilnej
                </h3>
                <p class="mt-1 text-xs leading-relaxed text-muted">
                  Skrót najnowszych zmian w oficjalnej aplikacji na Androida — szczegóły techniczne i historia całego systemu (web + backend + mobilka) są też w panelu administracyjnym.
                </p>
                <ul class="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
                  <li>
                    <span class="text-highlighted">v0.9.5-dev:</span>
                    skaner QR obecności, share wyniku jako grafika, czat (online + reakcje), bezpieczne przechowywanie sesji, kanały powiadomień.
                  </li>
                  <li>
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
                    wylogowanie ze wszystkich urządzeń z witryny unieważnia token także w aplikacji mobilnej.
                  </li>
                </ul>
                <p v-if="auth.isAdmin" class="mt-4 text-xs text-muted">
                  <NuxtLink
                    class="font-medium text-primary underline-offset-2 hover:underline"
                    to="/admin/changelog"
                  >
                    Pełny changelog systemu (panel admina)
                  </NuxtLink>
                  <span class="text-muted"> — wszystkie wpisy wydań web + mobilka + infrastruktura.</span>
                </p>
              </div>
            </section>
            </div>

            <div id="konto" class="scroll-mt-28 space-y-5 md:space-y-6">
              <p class="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Konto</p>
            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">
              <h2 class="text-base font-bold text-highlighted">
                Hasło
              </h2>
              <p class="mt-1 text-sm text-muted">
                Zostaw puste pola, żeby nie zmieniać hasła przy zapisie.
              </p>
              <div class="mt-5 grid gap-4 sm:grid-cols-2">
                <UFormField label="Nowe hasło" :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }">
                  <UInput
                    v-model="form.newPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder="········"
                    size="md"
                  />
                </UFormField>
                <UFormField label="Powtórzenie" :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }">
                  <UInput
                    v-model="form.confirmPassword"
                    type="password"
                    autocomplete="new-password"
                    placeholder="········"
                    size="md"
                  />
                </UFormField>
              </div>
            </section>

            </div>

            <div id="bezpieczenstwo" class="scroll-mt-28 space-y-5 md:space-y-6">
              <p class="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">Bezpieczeństwo</p>
            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">
              <h2 class="text-base font-bold text-highlighted">
                Uwierzytelnianie dwuskładnikowe
              </h2>
              <p class="mt-1 text-sm leading-relaxed text-muted">
                TOTP (np. Google Authenticator, Aegis).
              </p>
              <div class="mt-5 space-y-4">
                <UAlert
                  color="neutral"
                  variant="soft"
                  class="text-sm ring-1 ring-default/35"
                  title="Stan 2FA"
                  :description="
                    auth.user.value?.totp_enabled
                      ? 'Włączone — przy logowaniu potrzebny kod z aplikacji authenticator.'
                      : 'Wyłączone — logowanie tylko hasłem.'
                  "
                />
                <div v-if="!auth.user.value?.totp_enabled && !showTotpSetup">
                  <UButton
                    :loading="totpSetupLoading"
                    variant="outline"
                    color="primary"
                    size="md"
                    icon="i-lucide-scan-line"
                    @click="startTotpSetup"
                  >
                    Konfiguruj 2FA
                  </UButton>
                </div>
                <div v-if="showTotpSetup && totpSecret" class="space-y-3 rounded-xl border border-default/45 bg-muted/15 p-4 text-sm ring-1 ring-default/25">
                  <p class="text-muted">
                    Dodaj klucz w aplikacji authenticator, potem wpisz kod.
                  </p>
                  <p class="break-all font-mono text-xs text-highlighted">{{ totpSecret }}</p>
                  <p class="break-all font-mono text-[11px] text-muted">{{ totpUri }}</p>
                  <div class="flex flex-wrap gap-2">
                    <UInput v-model="totpEnableCode" placeholder="Kod 6 cyfr" maxlength="8" class="w-40" />
                    <UButton size="sm" color="primary" @click="enableTotp">
                      Włącz
                    </UButton>
                    <UButton variant="ghost" color="neutral" size="sm" @click="showTotpSetup = false; totpSecret = ''; totpUri = ''; totpEnableCode = ''">
                      Anuluj
                    </UButton>
                  </div>
                </div>
                <div v-if="auth.user.value?.totp_enabled" class="space-y-3 rounded-xl border border-default/35 bg-muted/10 p-4">
                  <UFormField label="Hasło (wymagane)" :ui="{ label: 'text-xs font-semibold uppercase tracking-wide text-muted' }">
                    <UInput
                      v-model="totpDisablePassword"
                      type="password"
                      autocomplete="current-password"
                      size="md"
                      class="max-w-xs"
                    />
                  </UFormField>
                  <UButton color="error" variant="soft" size="sm" icon="i-lucide-power" @click="disableTotp">
                    Wyłącz 2FA
                  </UButton>
                </div>
              </div>
            </section>

            <section class="rounded-2xl border border-error/50 bg-error/5 p-6 shadow-sm ring-1 ring-error/20 sm:p-7">
              <h2 class="text-base font-bold text-highlighted">
                Bezpieczeństwo sesji
              </h2>
              <p class="mt-1 text-sm leading-relaxed text-muted">
                Jeśli zgubiłeś urządzenie lub podejrzewasz nieautoryzowany dostęp, możesz wylogować się ze wszystkich miejsc naraz.
              </p>
              <div class="mt-5">
                <UButton
                  color="error"
                  variant="outline"
                  size="md"
                  icon="i-lucide-log-out"
                  :loading="logoutAllLoading"
                  @click="logoutFromAllDevices"
                >
                  Wyloguj ze wszystkich urządzeń
                </UButton>
              </div>
            </section>

            <section class="rounded-2xl border border-default/50 bg-card p-6 shadow-sm ring-1 ring-default/20 sm:p-7">
              <h2 class="text-base font-bold text-highlighted">
                Przypomnienie o składce
              </h2>
              <p class="mt-1 text-sm text-muted">
                Baner w panelu zawodnika przed 10. dniem miesiąca — ustawienie jest tylko na tym urządzeniu.
              </p>
              <div class="mt-5 flex flex-col gap-4 rounded-xl border border-dashed border-default/45 bg-muted/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span class="text-sm text-highlighted">
                  Nie pokazuj banera o składce
                </span>
                <USwitch v-model="hidePaymentReminder" size="lg" />
              </div>
            </section>
            </div>
          </div>
        </div>
      </div>
    </UContainer>

    <div class="fixed inset-x-0 bottom-0 z-50 flex border-t border-default/50 bg-elevated/95 pb-[max(0.85rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_28px_-12px_rgb(0_0_0/0.35)] backdrop-blur-md supports-backdrop-filter:bg-elevated/90 sm:hidden">
      <div class="mx-auto flex w-full max-w-xl gap-2.5 px-4">
        <UButton color="neutral" variant="outline" icon="i-lucide-rotate-ccw" class="min-h-12 flex-1 justify-center" @click="resetForm">
          Przywróć
        </UButton>
        <UButton color="primary" icon="i-lucide-save" class="min-h-12 flex-[1.25] justify-center font-bold shadow-md" :loading="saving" @click="save">
          Zapisz
        </UButton>
      </div>
    </div>
  </div>
</template>

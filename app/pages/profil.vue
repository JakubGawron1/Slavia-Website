<script setup lang="ts">
import { getApiErrorMessage } from '~/composables/useApi'
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

const form = reactive({
  avatar_url: '',
  newPassword: '',
  confirmPassword: ''
})

watch(
  () => auth.user.value,
  (u) => {
    if (!u) {
      return
    }
    /** Wpis w formularzu: jawny avatar konta lub — jak pusty — zdjęcie z profilu zawodnika (`/me`). */
    form.avatar_url = u.avatar_url?.trim() || u.athlete_image_url?.trim() || ''
  },
  { immediate: true }
)

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

onMounted(() => {
  if (auth.token.value) {
    auth.fetchMe()
  }
})

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
  <div class="relative overflow-hidden">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-[min(420px,55vh)] bg-linear-to-b from-primary/9 via-transparent to-transparent dark:from-primary/14"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -right-24 top-12 size-[380px] rounded-full bg-primary/6 blur-3xl dark:bg-primary/10"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -left-32 top-48 size-[280px] rounded-full bg-muted blur-3xl"
      aria-hidden="true"
    />

    <UContainer class="animate-page-in relative max-w-5xl px-3 py-6 pb-12 sm:px-6 sm:py-8 sm:pb-14 md:py-12 md:pb-20 lg:py-16">
      <!-- Nagłówek -->
      <header class="relative mb-10 md:mb-12">
        <div
          class="overflow-hidden rounded-3xl border border-default/70 bg-background/85 shadow-sm ring-1 ring-primary/8 backdrop-blur-md dark:bg-background/90"
        >
          <div class="relative px-5 py-7 md:flex md:items-start md:justify-between md:gap-8 md:px-10 md:py-9">
            <div class="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent opacity-80" />
            <div class="relative min-w-0 flex-1">
              <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                Konto użytkownika
              </p>
              <h1 class="mt-2 text-3xl font-bold tracking-tight text-highlighted md:text-4xl">
                Ustawienia konta
              </h1>
              <p class="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                Zmiana loginu jest po stronie administratorów — tutaj ustawiasz e-mail, zdjęcie oraz opcjonalnie nowe hasło.
              </p>
              <div class="mt-5 flex flex-wrap items-center gap-2">
                <UBadge
                  color="neutral"
                  variant="subtle"
                  size="md"
                  class="font-semibold"
                >
                  {{ auth.user.value?.username }}
                </UBadge>
                <UBadge
                  color="primary"
                  variant="subtle"
                  size="md"
                  class="font-semibold uppercase"
                >
                  {{ auth.rolesDisplayShort }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="grid gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
        <!-- Kolumna avatara -->
        <aside class="lg:col-span-5 xl:col-span-4">
          <UCard
            class="overflow-hidden border-default/70 shadow-md ring-1 ring-default/40 lg:sticky lg:top-[calc(5.5rem+env(safe-area-inset-top))] lg:self-start"
          >
            <div class="border-b border-default/60 bg-muted/25 px-5 py-4 dark:bg-muted/15">
              <h2 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-highlighted">
                <span class="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                  <UIcon
                    name="i-lucide-image-plus"
                    class="size-4"
                  />
                </span>
                Zdjęcie profilowe
              </h2>
              <p class="mt-2 text-[11px] leading-snug text-muted">
                Podgląd pokazuje zdjęcie konta lub — jeśli nie ma — zdjęcie z karty zawodnika. Adres URL zapisuje się przyciskiem „Zapisz zmiany”; wgrywanie pliku zapisuje od razu.
              </p>
            </div>

            <div class="flex flex-col items-center gap-6 p-6 md:p-8">
              <div class="relative">
                <div class="absolute -inset-1 rounded-full bg-linear-to-br from-primary/35 via-primary/10 to-transparent opacity-80 blur-md dark:opacity-100" />
                <div
                  class="relative size-36 overflow-hidden rounded-full ring-[3px] ring-background shadow-xl ring-offset-2 ring-offset-background md:size-44"
                >
                  <img
                    v-if="profileAvatarSrc && !avatarBroken"
                    :src="profileAvatarSrc"
                    :alt="`Zdjęcie profilowe ${auth.user.value?.username || ''}`"
                    class="size-full object-cover"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    @error="avatarBroken = true"
                  >
                  <div
                    v-else
                    class="flex size-full flex-col items-center justify-center gap-2 bg-linear-to-br from-muted to-muted/70 px-4 text-center"
                  >
                    <UIcon
                      name="i-lucide-user-round"
                      class="size-16 text-muted/90"
                    />
                    <span class="text-[11px] font-medium leading-tight text-muted">Brak zdjęcia lub błędny URL</span>
                  </div>
                </div>
              </div>

              <input
                ref="avatarFileInput"
                type="file"
                accept="image/*"
                class="sr-only"
                @change="onAvatarFileChange"
              >
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-upload-cloud"
                block
                size="lg"
                class="justify-center font-semibold"
                :loading="uploadLoading"
                @click="avatarFileInput?.click()"
              >
                Wgraj z urządzenia
              </UButton>
              <p class="text-xs leading-relaxed text-muted">
                Po wgraniu pliku adres zapisuje się od razu na koncie (odświeżenie strony nie straci zdjęcia).
              </p>
            </div>
          </UCard>
        </aside>

        <!-- Formularze -->
        <div class="min-w-0 space-y-8 lg:col-span-7 xl:col-span-8">
          <UCard class="border-default/70 shadow-md ring-1 ring-default/40">
            <div class="border-b border-default/60 bg-muted/20 px-5 py-4 dark:bg-muted/10 md:px-6">
              <h2 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-highlighted">
                <span class="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                  <UIcon
                    name="i-lucide-palette"
                    class="size-4"
                  />
                </span>
                Wygląd (tylko Twoje konto)
              </h2>
              <p class="mt-2 max-w-2xl text-[11px] leading-snug text-muted md:text-xs">
                Jasny / ciemny i zestawy kolorystyczne zapisujemy w tej przeglądarce powiązane z Twoim kontem.
                Goście widzą tylko przełącznik jasny–ciemny w nagłówku.
              </p>
            </div>
            <div class="space-y-6 p-5 md:p-8">
              <UFormField label="Tryb jasny / ciemny">
                <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <UButton
                    size="lg"
                    class="min-h-11 w-full touch-manipulation sm:w-auto"
                    :variant="colorMode.preference === 'light' ? 'solid' : 'outline'"
                    color="neutral"
                    icon="i-lucide-sun"
                    @click="colorMode.preference = 'light'"
                  >
                    Jasny
                  </UButton>
                  <UButton
                    size="lg"
                    class="min-h-11 w-full touch-manipulation sm:w-auto"
                    :variant="colorMode.preference === 'dark' ? 'solid' : 'outline'"
                    color="neutral"
                    icon="i-lucide-moon"
                    @click="colorMode.preference = 'dark'"
                  >
                    Ciemny
                  </UButton>
                </div>
              </UFormField>
              <UFormField label="Motyw kolorystyczny">
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    v-for="p in presets"
                    :key="p.id"
                    type="button"
                    class="min-h-13 touch-manipulation rounded-2xl border px-4 py-3.5 text-left transition-colors ring-1 sm:min-h-0 sm:py-3"
                    :class="
                      preset === p.id
                        ? 'border-primary/60 bg-primary/10 ring-primary/35'
                        : 'border-default/70 bg-muted/10 ring-default/30 hover:border-primary/35'
                    "
                    @click="setPreset(p.id)"
                  >
                    <span class="block text-sm font-semibold text-highlighted">{{ p.label }}</span>
                    <span class="mt-1 block text-xs leading-snug text-muted">{{ p.description }}</span>
                  </button>
                </div>
              </UFormField>
            </div>
          </UCard>

          <UCard class="border-default/70 shadow-md ring-1 ring-default/40">
            <div class="border-b border-default/60 bg-muted/20 px-5 py-4 dark:bg-muted/10 md:px-6">
              <h2 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-highlighted">
                <span class="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                  <UIcon
                    name="i-lucide-mail"
                    class="size-4"
                  />
                </span>
                Dane kontaktowe
              </h2>
            </div>
            <div class="space-y-6 p-5 md:p-8">
              <UFormField
                label="Adres URL zdjęcia"
                description="Opcjonalnie zamiast lub oprócz wgrywania pliku"
              >
                <UInput
                  v-model="form.avatar_url"
                  type="url"
                  placeholder="https://..."
                  size="lg"
                  class="w-full font-mono text-sm"
                />
              </UFormField>

              <p class="rounded-xl border border-dashed border-default/70 bg-muted/20 px-4 py-3 text-xs leading-relaxed text-muted dark:bg-muted/10">
                Po wgraniu nowego pliku poprzednie zdjęcie w Cloudinary jest usuwane przy zapisie konta, jeśli zmienisz adres obrazka.
              </p>
            </div>
          </UCard>

          <UCard class="border-default/70 shadow-md ring-1 ring-default/40">
            <div class="border-b border-default/60 bg-muted/20 px-5 py-4 dark:bg-muted/10 md:px-6">
              <h2 class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-highlighted">
                <span class="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
                  <UIcon
                    name="i-lucide-key-round"
                    class="size-4"
                  />
                </span>
                Hasło
              </h2>
              <p class="mt-2 text-[11px] text-muted">
                Zostaw pola puste, jeśli nie chcesz zmieniać hasła przy tym zapisie.
              </p>
            </div>
            <div class="grid gap-6 p-5 md:grid-cols-2 md:p-8">
              <UFormField
                label="Nowe hasło"
                class="md:col-span-1"
              >
                <UInput
                  v-model="form.newPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="••••••••"
                  size="lg"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Powtórz nowe hasło"
                class="md:col-span-1"
              >
                <UInput
                  v-model="form.confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Powtórz to samo"
                  size="lg"
                  class="w-full"
                />
              </UFormField>
            </div>
          </UCard>

          <div
            class="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
          >
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-arrow-left"
              to="/"
              size="lg"
            >
              Strona główna
            </UButton>
            <div class="flex flex-wrap gap-2 sm:justify-end">
              <UButton
                color="neutral"
                variant="soft"
                size="lg"
                @click="resetForm"
              >
                Przywróć zapisane
              </UButton>
              <UButton
                :loading="saving"
                size="lg"
                class="min-w-44 justify-center font-bold shadow-md shadow-primary/20"
                @click="save"
              >
                Zapisz zmiany
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { pickPostLoginPath } from '~/composables/useAuth'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({
  middleware: 'guest'
})

const auth = useAuth()
const { accountSettingsPath } = useRoleDashboardNav()
const route = useRoute()
const toast = useToast()

const username = ref('')
const password = ref('')
const totpCode = ref('')
const totpStep = ref(false)
const loading = ref(false)
const showPassword = ref(false)

watch([username, password], () => {
  totpStep.value = false
  totpCode.value = ''
})

useSeoMeta({
  title: 'Logowanie — Slavia Ruda Śląska',
  description: 'Logowanie do panelu klubowego CKS Slavia.'
})

async function submit() {
  loading.value = true
  try {
    const user = await auth.login(
      username.value.trim(),
      password.value,
      totpStep.value ? totpCode.value : null
    )
    const raw = route.query.redirect
    const redirect =
      typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')
        ? raw
        : undefined
    await navigateTo(redirect ?? pickPostLoginPath(user?.roles ?? []), { replace: true })
  } catch (e) {
    const err = e as { data?: { code?: string }, response?: { status?: number } }
    if (err?.response?.status === 403 && err?.data?.code === 'account_banned') {
      await navigateTo('/banned', { replace: true })
      return
    }
    const msg = getApiErrorMessage(e, '')
    if (!totpStep.value && msg === 'totp_required') {
      totpStep.value = true
      toast.add({
        title: 'Wymagane dwuskładnikowe logowanie',
        description: 'Wpisz 6-cyfrowy kod z aplikacji authenticator.',
        color: 'warning'
      })
    } else {
      toast.add({
        title: 'Błąd logowania',
        description: getApiErrorMessage(e, 'Sprawdź dane logowania i połączenie z API.'),
        color: 'error'
      })
    }
  } finally {
    loading.value = false
  }
}

const perks = [
  { icon: 'i-lucide-dumbbell', text: 'Dziennik i wyniki' },
  { icon: 'i-lucide-calendar-days', text: 'Kalendarz startów' },
  { icon: 'i-lucide-user-circle', text: 'Profil zawodnika' }
] as const
</script>

<template>
  <div class="slavia-auth-shell slavia-login-shell">
    <div
      class="slavia-login-ambient"
      aria-hidden="true"
    >
      <div class="slavia-login-ambient__orb slavia-login-ambient__orb--a" />
      <div class="slavia-login-ambient__orb slavia-login-ambient__orb--b" />
      <div class="slavia-login-ambient__grid" />
    </div>

    <PublicPageLayout
      narrow
      padding="compact"
      :ambient="false"
      class="relative py-0!"
    >
      <div class="slavia-login-stage mx-auto w-full max-w-4xl">
        <div class="slavia-login-grid">
          <aside class="slavia-login-aside">
            <NuxtLink
              to="/"
              class="slavia-login-brand group"
            >
              <span class="slavia-login-brand__mark">
                <img
                  src="/logo.png"
                  alt="Logo CKS Slavia"
                  class="h-9 w-auto"
                >
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-bold tracking-tight text-highlighted">
                  CKS Slavia
                </span>
                <span class="block text-xs text-muted">
                  Ruda Śląska
                </span>
              </span>
            </NuxtLink>

            <div class="slavia-login-aside__copy">
              <span class="slavia-login-eyebrow">
                <UIcon
                  name="i-lucide-sparkles"
                  class="size-3.5"
                  aria-hidden="true"
                />
                Panel klubowy
              </span>
              <h1 class="slavia-display slavia-login-title">
                Zaloguj się
              </h1>
              <p class="slavia-login-lead">
                Te same dane co w aplikacji mobilnej — wyniki, treningi i komunikacja z kadrą w jednym miejscu.
              </p>
            </div>

            <ul class="slavia-login-perks hidden sm:flex">
              <li
                v-for="(perk, index) in perks"
                :key="perk.text"
                class="slavia-login-perk"
                :style="{ '--perk-i': index }"
              >
                <span class="slavia-login-perk__icon">
                  <UIcon
                    :name="perk.icon"
                    class="size-4"
                    aria-hidden="true"
                  />
                </span>
                <span class="slavia-login-perk__text">{{ perk.text }}</span>
              </li>
            </ul>

            <p class="slavia-login-trust hidden sm:flex">
              <UIcon
                name="i-lucide-shield-check"
                class="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              Połączenie szyfrowane — dane logowania nie są przechowywane w przeglądarce.
            </p>
          </aside>

          <div class="slavia-login-panel">
            <div
              class="slavia-login-panel__accent"
              aria-hidden="true"
            />

            <header class="slavia-login-panel__header">
              <div class="slavia-login-panel__icon-wrap">
                <UIcon
                  name="i-lucide-lock-keyhole"
                  class="size-5 text-primary"
                  aria-hidden="true"
                />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-highlighted">
                  {{ totpStep ? 'Weryfikacja 2FA' : 'Dane logowania' }}
                </p>
                <p class="text-xs text-muted">
                  {{ totpStep ? 'Kod z aplikacji authenticator' : 'Login klubowy od trenera lub administracji' }}
                </p>
              </div>
            </header>

            <form
              class="slavia-login-form"
              @submit.prevent="submit"
            >
              <UFormField
                label="Nazwa użytkownika"
                required
                class="slavia-login-field"
              >
                <UInput
                  v-model="username"
                  autocomplete="username"
                  placeholder="np. jan.kowalski"
                  size="lg"
                  icon="i-lucide-user"
                  :ui="{ base: 'slavia-login-input' }"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Hasło"
                required
                class="slavia-login-field"
              >
                <UInput
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  size="lg"
                  icon="i-lucide-lock"
                  :ui="{ base: 'slavia-login-input' }"
                  class="w-full"
                >
                  <template #trailing>
                    <UButton
                      type="button"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="showPassword ? 'Ukryj hasło' : 'Pokaż hasło'"
                      class="rounded-lg"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </UInput>
              </UFormField>

              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <UFormField
                  v-if="totpStep"
                  label="Kod 2FA"
                  required
                  class="slavia-login-field"
                >
                  <UInput
                    v-model="totpCode"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    placeholder="000000"
                    maxlength="8"
                    size="lg"
                    icon="i-lucide-shield-check"
                    :ui="{ base: 'slavia-login-input slavia-login-input--totp' }"
                    class="w-full font-mono tracking-[0.2em]"
                  />
                </UFormField>
              </Transition>

              <UButton
                type="submit"
                block
                size="lg"
                :loading="loading"
                :icon="totpStep ? 'i-lucide-shield-check' : 'i-lucide-log-in'"
                class="slavia-login-submit font-semibold"
              >
                {{ totpStep ? 'Potwierdź kod' : 'Zaloguj się' }}
              </UButton>
            </form>

            <ul class="slavia-login-perks-mobile flex sm:hidden">
              <li
                v-for="perk in perks"
                :key="perk.text"
                class="slavia-login-perk-chip"
              >
                <UIcon
                  :name="perk.icon"
                  class="size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {{ perk.text }}
              </li>
            </ul>

            <div class="slavia-login-panel__foot">
              <p class="text-xs leading-relaxed text-muted">
                <UIcon
                  name="i-lucide-fingerprint"
                  class="mr-1 inline size-3.5 align-[-2px] text-primary/80"
                  aria-hidden="true"
                />
                2FA włączysz po zalogowaniu w
                <NuxtLink
                  :to="accountSettingsPath"
                  class="font-medium text-primary underline-offset-2 hover:underline"
                >ustawieniach konta</NuxtLink>.
              </p>
              <p class="text-xs text-muted">
                Problemy z dostępem?
                <span class="font-medium text-highlighted">Zgłoś to trenerowi.</span>
              </p>
            </div>
          </div>
        </div>

        <p class="slavia-login-back">
          <NuxtLink
            to="/"
            class="group inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="size-4 transition-transform group-hover:-translate-x-0.5"
            />
            Strona główna
          </NuxtLink>
        </p>
      </div>
    </PublicPageLayout>
  </div>
</template>



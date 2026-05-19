<script setup lang="ts">
import { pickPostLoginPath } from '~/composables/useAuth'
import { getApiErrorMessage } from '~/composables/useApi'

definePageMeta({
  middleware: 'guest'
})

const auth = useAuth()
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
    await navigateTo(redirect ?? pickPostLoginPath(user?.roles ?? []))
  } catch (e) {
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
                  to="/profil"
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

<style scoped>
.slavia-login-shell {
  position: relative;
  isolation: isolate;
  animation: slavia-login-fade-in 0.45s ease both;
}

.slavia-login-ambient {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.slavia-login-ambient__orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(72px);
}

.slavia-login-ambient__orb--a {
  left: -12%;
  top: 8%;
  width: min(28rem, 55vw);
  height: min(28rem, 55vw);
  background: color-mix(in oklab, var(--ui-primary) 22%, transparent);
}

.slavia-login-ambient__orb--b {
  right: -8%;
  bottom: 12%;
  width: min(24rem, 48vw);
  height: min(24rem, 48vw);
  background: color-mix(in oklab, var(--ui-primary) 14%, transparent);
}

.slavia-login-ambient__grid {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image:
    linear-gradient(color-mix(in srgb, var(--ui-border) 35%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--ui-border) 35%, transparent) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%);
}

.slavia-login-stage {
  position: relative;
  z-index: 1;
}

.slavia-login-aside__copy,
.slavia-login-perks,
.slavia-login-trust {
  animation: slavia-login-slide-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both;
}

.slavia-login-panel {
  animation: slavia-login-slide-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.12s both;
}

@keyframes slavia-login-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slavia-login-slide-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slavia-login-grid {
  display: grid;
  gap: 1.5rem;
  align-items: center;
}

@media (min-width: 640px) {
  .slavia-login-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 23rem);
    gap: 2.25rem;
  }
}

@media (min-width: 1024px) {
  .slavia-login-grid {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 25rem);
    gap: 3rem;
  }
}

.slavia-login-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.875rem;
  transition: opacity 0.2s ease;
}

.slavia-login-brand:hover {
  opacity: 0.92;
}

.slavia-login-brand__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.875rem;
  border: 1px solid color-mix(in srgb, var(--ui-primary) 28%, var(--ui-border));
  background: linear-gradient(
    145deg,
    color-mix(in oklab, var(--ui-bg-elevated) 96%, var(--ui-primary) 6%),
    color-mix(in oklab, var(--ui-bg) 88%, transparent)
  );
  box-shadow:
    0 0 0 1px color-mix(in srgb, #fff 6%, transparent) inset,
    var(--slavia-shadow-sm);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.slavia-login-brand:hover .slavia-login-brand__mark {
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px color-mix(in srgb, #fff 8%, transparent) inset,
    var(--slavia-shadow-md),
    var(--slavia-shadow-glow);
}

.slavia-login-aside__copy {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .slavia-login-aside__copy {
    margin-top: 2.5rem;
  }
}

.slavia-login-eyebrow {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--ui-primary) 35%, transparent);
  background: color-mix(in oklab, var(--ui-primary) 12%, transparent);
  padding: 0.25rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ui-primary);
}

.slavia-login-title {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  line-height: 1.1;
  color: var(--ui-text-highlighted, var(--ui-text));
}

.slavia-login-lead {
  max-width: 22rem;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--ui-text-muted);
}

.slavia-login-perks {
  margin-top: 2rem;
  flex-direction: column;
  gap: 0.625rem;
  list-style: none;
  padding: 0;
}

.slavia-login-perk {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.875rem;
  border: 1px solid transparent;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  animation: slavia-login-slide-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) calc(0.12s + var(--perk-i, 0) * 0.06s) both;
}

.slavia-login-perk:hover {
  border-color: color-mix(in srgb, var(--ui-primary) 22%, var(--ui-border));
  background: color-mix(in oklab, var(--ui-bg-elevated) 88%, var(--ui-primary) 4%);
  transform: translateX(3px);
}

.slavia-login-perk__icon {
  display: flex;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.625rem;
  background: color-mix(in oklab, var(--ui-primary) 14%, transparent);
  color: var(--ui-primary);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ui-primary) 22%, transparent);
}

.slavia-login-perk__text {
  font-weight: 500;
  color: var(--ui-text-toned, var(--ui-text));
}

.slavia-login-trust {
  margin-top: 1.75rem;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--ui-text-muted);
}

.slavia-login-panel {
  position: relative;
  overflow: hidden;
  border-radius: 1.375rem;
  border: 1px solid color-mix(in srgb, var(--ui-border) 50%, transparent);
  background: linear-gradient(
    168deg,
    color-mix(in oklab, var(--ui-bg-elevated) 97%, var(--ui-primary) 4%),
    color-mix(in oklab, var(--ui-bg-elevated) 92%, transparent)
  );
  box-shadow:
    var(--slavia-shadow-md),
    0 0 0 1px color-mix(in srgb, #fff 5%, transparent) inset;
  padding: 1.375rem;
}

@media (min-width: 640px) {
  .slavia-login-panel {
    padding: 1.625rem;
  }
}

.slavia-login-panel__accent {
  pointer-events: none;
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--ui-primary),
    color-mix(in oklab, var(--ui-primary) 60%, #fff),
    var(--ui-primary),
    transparent
  );
  opacity: 0.9;
}

.slavia-login-panel__header {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  margin-bottom: 1.25rem;
}

.slavia-login-panel__icon-wrap {
  display: flex;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: color-mix(in oklab, var(--ui-primary) 12%, var(--ui-bg));
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--ui-primary) 25%, transparent);
}

html[data-slavia-preset='glass'] .slavia-login-panel {
  background: var(--slavia-glass-bg);
  backdrop-filter: blur(var(--slavia-glass-blur, 16px)) saturate(var(--slavia-glass-saturate, 1.2));
  -webkit-backdrop-filter: blur(var(--slavia-glass-blur, 16px)) saturate(var(--slavia-glass-saturate, 1.2));
  border-color: var(--slavia-glass-border);
  box-shadow: var(--slavia-glass-shadow);
}

.slavia-login-form {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.slavia-login-form :deep(.slavia-login-field label) {
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ui-text-muted);
}

.slavia-login-form :deep(.slavia-login-input) {
  min-height: 2.875rem;
  border-radius: 0.8125rem;
  border-color: color-mix(in srgb, var(--ui-border) 65%, transparent);
  background: color-mix(in oklab, var(--ui-bg) 90%, transparent);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    transform 0.15s ease;
}

.slavia-login-form :deep(.slavia-login-input:hover) {
  border-color: color-mix(in srgb, var(--ui-primary) 30%, var(--ui-border));
}

.slavia-login-form :deep(.slavia-login-input:focus-within) {
  border-color: color-mix(in srgb, var(--ui-primary) 50%, var(--ui-border));
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--ui-primary) 16%, transparent),
    var(--slavia-shadow-xs);
  background: var(--ui-bg);
  transform: translateY(-1px);
}

.slavia-login-form :deep(.slavia-login-input--totp input) {
  text-align: center;
  letter-spacing: 0.25em;
}

.slavia-login-submit {
  margin-top: 0.25rem;
  min-height: 2.875rem;
  border-radius: 0.8125rem;
  box-shadow:
    0 4px 14px -4px color-mix(in srgb, var(--ui-primary) 55%, transparent),
    var(--slavia-shadow-xs);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.slavia-login-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 8px 22px -6px color-mix(in srgb, var(--ui-primary) 50%, transparent),
    var(--slavia-shadow-sm);
}

.slavia-login-perks-mobile {
  margin-top: 1.25rem;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
}

.slavia-login-perk-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--ui-border) 55%, transparent);
  background: color-mix(in oklab, var(--ui-bg) 85%, var(--ui-primary) 3%);
  padding: 0.35rem 0.65rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--ui-text-muted);
}

.slavia-login-panel__foot {
  margin-top: 1.375rem;
  padding-top: 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid color-mix(in srgb, var(--ui-border) 38%, transparent);
}

.slavia-login-back {
  margin-top: 1.75rem;
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .slavia-login-shell,
  .slavia-login-panel,
  .slavia-login-aside__copy,
  .slavia-login-perks,
  .slavia-login-trust,
  .slavia-login-perk,
  .slavia-login-submit:hover:not(:disabled),
  .slavia-login-form :deep(.slavia-login-input:focus-within) {
    animation: none !important;
    transform: none !important;
  }
}
</style>

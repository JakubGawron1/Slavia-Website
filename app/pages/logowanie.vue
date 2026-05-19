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
</script>

<template>
  <div
    class="slavia-auth-shell"
  >
    <PublicPageLayout
      narrow
      padding="compact"
      class="!py-0"
    >
      <div class="mx-auto w-full max-w-md">
        <div class="mb-8 text-center">
          <NuxtLink
            to="/"
            class="inline-block transition-transform duration-300 hover:scale-105"
          >
            <img
              src="/logo.png"
              alt="Slavia Logo"
              class="mx-auto h-20 w-auto drop-shadow-lg sm:h-24"
            >
          </NuxtLink>
        </div>

        <PublicPageHeader
          variant="centered"
          eyebrow="Panel klubowy"
          icon="i-lucide-lock-keyhole"
          class="!mb-6 md:!mb-8"
        >
          <template #title>
            Zaloguj się do <span class="text-primary">Slavii</span>
          </template>
          <template #description>
            Zarządzaj wynikami, treningami i profilem zawodnika w jednym miejscu.
          </template>
        </PublicPageHeader>

        <div class="slavia-glass slavia-page-card overflow-hidden rounded-3xl p-6 shadow-md sm:p-8">
          <form
            class="space-y-6"
            @submit.prevent="submit"
          >
            <UFormField
              label="Nazwa użytkownika"
              required
            >
              <UInput
                v-model="username"
                autocomplete="username"
                placeholder="Login"
                size="lg"
                icon="i-lucide-user"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Hasło"
              required
            >
              <UInput
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                size="lg"
                icon="i-lucide-lock"
                class="w-full"
              />
            </UFormField>

            <UFormField
              v-if="totpStep"
              label="Kod 2FA (authenticator)"
              required
            >
              <UInput
                v-model="totpCode"
                inputmode="numeric"
                autocomplete="one-time-code"
                placeholder="000000"
                maxlength="8"
                size="lg"
                icon="i-lucide-shield"
                class="w-full"
              />
            </UFormField>

            <UButton
              type="submit"
              block
              size="lg"
              :loading="loading"
              class="mt-2 font-bold"
            >
              Wejdź do systemu
            </UButton>
          </form>

          <div class="mt-6 space-y-2 border-t border-default/40 pt-6 text-center">
            <p class="text-xs leading-relaxed text-muted">
              Opcjonalne logowanie dwuskładnikowe (2FA) włączysz po zalogowaniu w
              <NuxtLink
                to="/profil"
                class="font-semibold text-primary underline-offset-2 hover:underline"
              >ustawieniach konta</NuxtLink>
              — domyślnie jest wyłączone.
            </p>
            <p class="text-sm font-medium text-muted">
              Problemy z dostępem?
              <span class="font-bold text-primary">Zgłoś to trenerowi.</span>
            </p>
          </div>
        </div>

        <div class="mt-8 text-center">
          <NuxtLink
            to="/"
            class="group inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary"
          >
            <UIcon
              name="i-lucide-arrow-left"
              class="size-4 transition-transform group-hover:-translate-x-1"
            />
            Strona główna
          </NuxtLink>
        </div>
      </div>
    </PublicPageLayout>
  </div>
</template>

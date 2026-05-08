<script setup lang="ts">
import { pickPostLoginPath } from '~/composables/useAuth'

const auth = useAuth()
const route = useRoute()
const toast = useToast()

const username = ref('')
const password = ref('')
const loading = ref(false)

useSeoMeta({
  title: 'Logowanie — Slavia Ruda Śląska',
  description: 'Logowanie do panelu klubowego CKS Slavia.'
})

async function submit() {
  loading.value = true
  try {
    const user = await auth.login(username.value.trim(), password.value)
    await auth.fetchMe()
    const raw = route.query.redirect
    const redirect = typeof raw === 'string' ? raw : undefined

    if (redirect) {
      await navigateTo(redirect)
    } else {
      await navigateTo(pickPostLoginPath(user?.roles ?? []))
    }
  } catch (e) {
    toast.add({
      title: 'Błąd logowania',
      description: getApiErrorMessage(e, 'Sprawdź dane logowania i połączenie z API.'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-linear-to-br from-background via-background to-primary/5 px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
    <!-- Dekoracyjne tło z animowanymi elementami -->
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div
        class="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
      />

      <!-- Pływające ikony -->
      <div
        class="absolute top-1/4 left-1/10 text-primary/10"
      >
        <UIcon
          name="i-lucide-dumbbell"
          class="size-20 rotate-12"
        />
      </div>
      <div
        class="absolute bottom-1/4 right-1/10 text-primary/10"
      >
        <UIcon
          name="i-lucide-trophy"
          class="size-24 -rotate-12"
        />
      </div>
      <div class="absolute top-3/4 left-1/4 text-primary/5">
        <UIcon
          name="i-lucide-award"
          class="size-32"
        />
      </div>

      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
    </div>

    <div class="relative z-10 w-full max-w-lg transition-all duration-700 transform translate-y-0 opacity-100 scale-100">
      <div class="mb-10 text-center">
        <NuxtLink
          to="/"
          class="inline-block transition-all duration-500 hover:scale-110 hover:rotate-3"
        >
          <div class="relative">
            <div class="absolute -inset-4 bg-primary/20 blur-xl rounded-full" />
            <img
              src="/logo.png"
              alt="Slavia Logo"
              class="relative mx-auto h-24 w-auto drop-shadow-2xl"
            >
          </div>
        </NuxtLink>
        <h1 class="mt-8 text-4xl font-black tracking-tighter text-highlighted sm:text-5xl uppercase italic">
          Panel <span class="text-primary">Klubowy</span>
        </h1>
        <p class="mt-4 text-lg font-medium text-muted/80">
          Zaloguj się, aby zarządzać swoimi wynikami.
        </p>
      </div>

      <UCard
        class="border-primary/20 bg-background/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl ring-1 ring-white/10"
        :ui="{ body: 'p-8 sm:p-12', header: 'border-b border-white/5', footer: 'border-t border-white/5 bg-white/5' }"
      >
        <form
          class="space-y-8"
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
              size="xl"
              icon="i-lucide-user"
              class="w-full"
              :ui="{ base: 'bg-white/5 border-white/10 focus:ring-primary/50' }"
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
              size="xl"
              icon="i-lucide-lock"
              class="w-full"
              :ui="{ base: 'bg-white/5 border-white/10 focus:ring-primary/50' }"
            />
          </UFormField>

          <UButton
            type="submit"
            block
            size="xl"
            :loading="loading"
            class="mt-6 font-black uppercase italic tracking-wider transition-all hover:tracking-[0.15em] hover:shadow-[0_0_20px_rgba(var(--color-primary-500),0.4)]"
          >
            Wejdź do systemu
          </UButton>
        </form>

        <template #footer>
          <div class="text-center py-2">
            <p class="text-sm text-muted font-medium">
              Problemy z dostępem?
              <span class="text-primary font-bold">Zgłoś to trenerowi.</span>
            </p>
          </div>
        </template>
      </UCard>

      <div class="mt-10 text-center">
        <NuxtLink
          to="/"
          class="group inline-flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-muted transition-all hover:text-primary"
        >
          <UIcon
            name="i-lucide-arrow-left"
            class="size-4 transition-transform group-hover:-translate-x-2"
          />
          Strona główna
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

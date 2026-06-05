<script setup lang="ts">
const auth = useAuth()

useSeoMeta({
  title: 'Konto zbanowane — Slavia',
  robots: 'noindex, nofollow'
})
</script>

<template>
  <div class="slavia-auth-shell">
    <PublicPageLayout
      narrow
      padding="compact"
      class="!py-0"
    >
      <PublicPageHeader
        variant="centered"
        eyebrow="Dostęp ograniczony"
        icon="i-lucide-shield-ban"
        class="!mb-6 md:!mb-8"
      >
        <template #title>
          Konto <span class="text-error">zbanowane</span>
        </template>
        <template #description>
          Dostęp do panelu został ograniczony przez kadrę klubu — np. z powodu zaległości ze składką lub innych ustaleń wewnętrznych.
        </template>
      </PublicPageHeader>

      <div class="slavia-page-card mx-auto max-w-md rounded-3xl p-6 shadow-md sm:p-8">
        <PublicEmptyState
          icon="i-lucide-lock"
          title="Nie możesz korzystać z aplikacji"
          description="Skontaktuj się z trenerem lub administratorem klubu, aby wyjaśnić sytuację i przywrócić dostęp."
          compact
        >
          <div
            v-if="auth.user.value?.banned_reason"
            class="w-full rounded-xl border border-error/35 bg-error/8 px-4 py-3 text-left text-sm text-highlighted ring-1 ring-error/20"
          >
            <p class="text-[11px] font-bold uppercase tracking-wider text-error">
              Powód blokady
            </p>
            <p class="mt-1.5 leading-relaxed text-muted">
              {{ auth.user.value.banned_reason }}
            </p>
          </div>

          <div class="flex flex-wrap items-center justify-center gap-3">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-log-out"
              @click="auth.logout()"
            >
              Wyloguj
            </UButton>
            <UButton
              to="/logowanie"
              color="primary"
              variant="soft"
              icon="i-lucide-arrow-left-right"
            >
              Zmień konto
            </UButton>
          </div>
        </PublicEmptyState>
      </div>
    </PublicPageLayout>
  </div>
</template>

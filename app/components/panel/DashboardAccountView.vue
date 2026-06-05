<script setup lang="ts">
const auth = useAuth()
const { closeAccountView } = useDashboardAccountView()

const profileAvatarSrc = computed(() => {
  const u = auth.user.value
  if (!u) return ''
  return u.avatar_url?.trim() || u.athlete_image_url?.trim() || ''
})
</script>

<template>
  <div class="space-y-6">
    <div
      class="relative overflow-hidden rounded-[1.75rem] border border-primary/20 bg-linear-to-br from-primary/12 via-card to-card p-5 shadow-sm ring-1 ring-primary/15 sm:p-6"
    >
      <div class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/20 blur-3xl" />
      <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-4">
          <UAvatar
            :src="profileAvatarSrc || undefined"
            :alt="auth.user.value?.username"
            size="xl"
            class="size-16 ring-2 ring-primary/25 sm:size-17"
          />
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              Ustawienia konta
            </p>
            <h1 class="mt-1 truncate text-xl font-black text-highlighted sm:text-2xl">
              {{ auth.user.value?.username }}
            </h1>
            <p v-if="auth.rolesDisplayShort" class="mt-1 truncate text-sm text-muted">
              {{ auth.rolesDisplayShort }}
            </p>
          </div>
        </div>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-arrow-left"
          size="lg"
          block
          class="h-11 w-full shrink-0 justify-center sm:w-auto sm:min-w-44"
          @click="closeAccountView()"
        >
          Panel główny
        </UButton>
      </div>
    </div>

    <AccountSettingsPanel embedded />
  </div>
</template>

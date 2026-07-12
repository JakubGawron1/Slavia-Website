<script setup lang="ts">
/**
 * Punkt „ideas”: onboarding po pierwszym wejściu w panel — checklist + pominięcie (localStorage per user).
 */
import {
  onboardingStorageKeys,
  readOnboardingDismissed,
  writeOnboardingDismissed
} from '~/composables/useSlaviaOnboardingDismissed'

const auth = useAuth()
const route = useRoute()
const clubHubOn = useExperimentalFlag('club_hub')
const { accountSettingsPath } = useRoleDashboardNav()

const open = ref(false)

const portal = computed<'athlete' | 'staff' | 'superadmin' | null>(() => {
  if (!auth.isLoggedIn.value) return null
  const p = route.path.replace(/\/+$/, '') || '/'
  if (auth.isSuperAdmin.value && p === '/superadmin') return 'superadmin'
  if (auth.isSuperAdmin.value) return null
  if (auth.isAthlete.value && p === '/athlete') return 'athlete'
  const staffHome = ['/trainer', '/admin']
  const isStaffRole = auth.isTrainer.value || auth.isAdmin.value
  if (staffHome.includes(p) && isStaffRole) return 'staff'
  return null
})

function dismiss(variant: 'athlete' | 'staff' | 'superadmin') {
  const uid = auth.user.value?.id
  if (!uid) {
    open.value = false
    return
  }
  writeOnboardingDismissed(onboardingStorageKeys(uid)[variant])
  open.value = false
}

const userId = computed(() => auth.user.value?.id)
const { progressLabel, markStepDone } = useOnboardingChecklist(userId, portal)

watch(
  [portal, () => auth.user.value?.id, () => auth.isLoggedIn.value],
  () => {
    if (!import.meta.client) return
    const uid = auth.user.value?.id
    const pv = portal.value
    if (!uid || !pv) {
      open.value = false
      return
    }
    const key = onboardingStorageKeys(uid)[pv]
    if (readOnboardingDismissed(key)) {
      open.value = false
      return
    }
    open.value = true
  },
  { immediate: true }
)
</script>

<template>
  <SlaviaModal
    v-model:open="open"
    title="Powitanie"
    :description="progressLabel ? `Krótki start po zalogowaniu — postęp: ${progressLabel}` : 'Krótki start po zalogowaniu.'"
    :dismissible="true"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #body>
      <div v-if="portal === 'athlete'" class="space-y-4 px-5 pb-5 sm:p-6 sm:pb-7">
        <p class="text-sm leading-relaxed text-muted">
          Jesteś na <span class="font-semibold text-highlighted">panelu zawodnika</span>.
          Rozpocznij od profilu i najczęstszych modułów — możesz wrócić tu w dowolnej chwili z menu.
        </p>
        <ul class="space-y-2.5 text-sm text-highlighted">
          <li class="flex gap-2">
            <UIcon name="i-lucide-check-circle" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span><NuxtLink class="font-semibold text-primary underline-offset-2 hover:underline" :to="accountSettingsPath" @click="markStepDone('profile')">Uzupełnij profil</NuxtLink> — zdjęcie, dane konta</span>
          </li>
          <li class="flex gap-2">
            <UIcon name="i-lucide-check-circle" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span><NuxtLink class="font-semibold text-primary underline-offset-2 hover:underline" to="/athlete/skladki" @click="markStepDone('payments')">Składka klubowa</NuxtLink> — status i zgłoszenia</span>
          </li>
          <li class="flex gap-2">
            <UIcon name="i-lucide-check-circle" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span><NuxtLink class="font-semibold text-primary underline-offset-2 hover:underline" to="/athlete/kalendarz" @click="markStepDone('calendar')">Kalendarz startów</NuxtLink> — przypisania od kadry</span>
          </li>
        </ul>
        <div class="flex flex-col gap-2 border-t border-default/60 pt-4 sm:flex-row sm:justify-between">
          <UButton color="neutral" variant="ghost" @click="dismiss('athlete')">
            Nie pokazuj więcej
          </UButton>
          <div class="flex flex-col gap-2 sm:flex-row">
            <UButton
              v-if="clubHubOn"
              to="/klub/samouczek"
              variant="outline"
              color="primary"
              icon="i-lucide-graduation-cap"
              @click="open = false"
            >
              Pełny samouczek
            </UButton>
            <UButton :to="accountSettingsPath" @click="open = false">
              Przejdź do profilu
            </UButton>
          </div>
        </div>
      </div>

      <div v-else-if="portal === 'staff'" class="space-y-4 px-5 pb-5 sm:p-6 sm:pb-7">
        <p class="text-sm leading-relaxed text-muted">
          Panel <span class="font-semibold text-highlighted">kadry / administracji</span> —
          skróty do najczęstszych miejsc. Szczegóły modułów są na dashboardzie.
        </p>
        <ul class="space-y-2.5 text-sm text-highlighted">
          <li class="flex gap-2">
            <UIcon name="i-lucide-layout-dashboard" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Dashboard — grupy modułów i KPI u góry strony</span>
          </li>
          <li class="flex gap-2">
            <UIcon name="i-lucide-calendar" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span><NuxtLink class="font-semibold text-primary underline-offset-2 hover:underline" to="/kalendarz">Kalendarz</NuxtLink> — zawody i treningi</span>
          </li>
          <li class="flex gap-2">
            <UIcon name="i-lucide-users" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Baza zawodników — z menu lub kafelka na dashboardzie</span>
          </li>
        </ul>
        <div class="flex flex-col gap-2 border-t border-default/60 pt-4 sm:flex-row sm:justify-between">
          <UButton color="neutral" variant="ghost" @click="dismiss('staff')">
            Nie pokazuj więcej
          </UButton>
          <div class="flex flex-col gap-2 sm:flex-row">
            <UButton
              v-if="clubHubOn"
              to="/klub/samouczek"
              variant="outline"
              color="primary"
              icon="i-lucide-graduation-cap"
              @click="open = false"
            >
              Pełny samouczek
            </UButton>
            <UButton color="neutral" variant="outline" @click="open = false">
              Zamknij
            </UButton>
          </div>
        </div>
      </div>

      <div v-else-if="portal === 'superadmin'" class="space-y-4 px-5 pb-5 sm:p-6 sm:pb-7">
        <p class="text-sm leading-relaxed text-muted">
          Jesteś na <span class="font-semibold text-highlighted">panelu SuperAdmin</span> —
          narzędzia systemowe i konta o podwyższonym poziomie dostępu.
        </p>
        <ul class="space-y-2.5 text-sm text-highlighted">
          <li class="flex gap-2">
            <UIcon name="i-lucide-shield-alert" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span><NuxtLink class="font-semibold text-primary underline-offset-2 hover:underline" to="/superadmin/zawodnicy?tab=accounts">Konta i role</NuxtLink> — administratorzy, trenerzy, zawodnicy</span>
          </li>
          <li class="flex gap-2">
            <UIcon name="i-lucide-users" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span><NuxtLink class="font-semibold text-primary underline-offset-2 hover:underline" to="/superadmin/zawodnicy">Baza zawodników (superadmin)</NuxtLink></span>
          </li>
          <li class="flex gap-2">
            <UIcon name="i-lucide-terminal" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span><NuxtLink class="font-semibold text-primary underline-offset-2 hover:underline" to="/superadmin/developer">Dev tools</NuxtLink> — diagnostyka, flagi, ban (smoke)</span>
          </li>
          <li class="flex gap-2">
            <UIcon name="i-lucide-file-text" class="mt-0.5 size-4 shrink-0 text-primary" />
            <span><NuxtLink class="font-semibold text-primary underline-offset-2 hover:underline" to="/admin/changelog">Changelog</NuxtLink> — podsumowania wydań</span>
          </li>
        </ul>
        <div class="flex flex-col gap-2 border-t border-default/60 pt-4 sm:flex-row sm:justify-end">
          <UButton color="neutral" variant="ghost" @click="dismiss('superadmin')">
            Nie pokazuj więcej
          </UButton>
          <UButton color="neutral" variant="outline" @click="open = false">
            Zamknij
          </UButton>
        </div>
      </div>
    </template>
  </SlaviaModal>
</template>

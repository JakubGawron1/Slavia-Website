<script setup lang="ts">
import type { DashboardModuleLink } from '~/utils/dashboardLink'
import { useRoleDashboardNav, type RoleDashboardItem } from '~/composables/useRoleDashboardNav'

export type PanelModuleGroup = {
  title: string
  items: DashboardModuleLink[]
}

const props = defineProps<{
  groups: PanelModuleGroup[]
  toneFromBg?: (bg?: string) => 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
}>()

const auth = useAuth()
const { availableDashboards } = useRoleDashboardNav()
const { syncing: syncingMobile, syncMobileReleases } = useMobileReleaseSync()
const route = useRoute()

const showSuperAdminToolbar = computed(() => auth.isSuperAdmin.value)
const showNavToolbar = computed(() => hasMultipleRoles.value || showSuperAdminToolbar.value)

const defaultToneFromBg = (bg?: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const s = String(bg || '').toLowerCase()
  if (s.includes('red') || s.includes('rose')) return 'error'
  if (s.includes('orange') || s.includes('amber') || s.includes('yellow')) return 'warning'
  if (s.includes('emerald') || s.includes('green') || s.includes('teal') || s.includes('lime')) return 'success'
  if (s.includes('sky') || s.includes('cyan') || s.includes('blue') || s.includes('indigo')) return 'info'
  if (s.includes('violet') || s.includes('purple') || s.includes('fuchsia') || s.includes('primary')) return 'primary'
  return 'neutral'
}

const resolveTone = (link: DashboardModuleLink) => (props.toneFromBg ?? defaultToneFromBg)(link.bg)

const hasMultipleRoles = computed(() => availableDashboards.value.length > 1)

const ROLE_SHORT_LABELS: Record<string, string> = {
  superadmin: 'SuperAdmin',
  admin: 'Admin',
  trainer: 'Trener',
  athlete: 'Zawodnik'
}

const ROLE_TAB_ACTIVE: Record<string, string> = {
  superadmin: 'bg-error/12 text-error ring-1 ring-error/25',
  admin: 'bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/30 dark:text-amber-300',
  trainer: 'bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/30 dark:text-emerald-300',
  athlete: 'bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/30 dark:text-sky-300'
}

function isDashboardTabActive(area: RoleDashboardItem['area'], to: string): boolean {
  if (route.path === to) return true
  if (area === 'superadmin' && route.path.startsWith('/superadmin')) return true
  if (area === 'admin' && route.path.startsWith('/admin')) return true
  if (area === 'trainer' && route.path.startsWith('/trainer')) return true
  if (area === 'athlete' && route.path.startsWith('/athlete')) return true
  return false
}

function roleTabClass(area: string, active: boolean) {
  if (active) return ROLE_TAB_ACTIVE[area] ?? ROLE_TAB_ACTIVE.admin
  return 'text-muted hover:bg-muted/15 hover:text-highlighted'
}
</script>

<template>
  <section class="slavia-panel-section" aria-label="Moduły panelu">
    <div class="overflow-hidden rounded-2xl border border-default/60 bg-card/80 shadow-sm ring-1 ring-default/20 backdrop-blur-sm">
      <div
        v-if="showNavToolbar"
        class="flex items-center gap-2 border-b border-default/50 bg-muted/6 p-2.5 sm:p-3"
      >
        <div
          v-if="hasMultipleRoles"
          class="flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Przełącz panel roli"
        >
          <NuxtLink
            v-for="d in availableDashboards"
            :key="d.area"
            :to="d.to"
            role="tab"
            :aria-selected="isDashboardTabActive(d.area, d.to)"
            class="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="roleTabClass(d.area, isDashboardTabActive(d.area, d.to))"
          >
            <UIcon :name="d.icon" class="size-4 shrink-0" />
            {{ ROLE_SHORT_LABELS[d.area] ?? d.label }}
          </NuxtLink>
        </div>

        <p
          v-else
          class="min-w-0 flex-1 truncate px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted"
        >
          Moduły panelu
        </p>

        <UButton
          v-if="showSuperAdminToolbar"
          size="sm"
          variant="soft"
          color="neutral"
          icon="i-lucide-smartphone"
          :loading="syncingMobile"
          class="shrink-0"
          @click="syncMobileReleases"
        >
          <span class="hidden sm:inline">Sync aplikacji</span>
          <span class="sm:hidden">Sync APK</span>
        </UButton>
      </div>

      <div class="divide-y divide-default/40">
        <div
          v-for="(group, gi) in groups"
          :key="group.title"
          class="p-3 sm:p-4"
        >
          <h3 class="mb-2.5 px-1 text-[10px] font-black uppercase tracking-[0.22em] text-muted">
            {{ group.title }}
          </h3>
          <ul class="grid grid-cols-1 gap-0.5 sm:grid-cols-2 sm:gap-1">
            <li
              v-for="(link, index) in group.items"
              :key="String(link.to)"
              v-slavia-reveal="{ variant: 'fade-up', delay: gi * 40 + index * 25 }"
            >
              <DashboardModuleRow
                :title="link.title"
                :description="link.description"
                :icon="link.icon"
                :to="link.to"
                :tone="resolveTone(link)"
                :icon-wrapper-class="`${link.bg} ${link.color}`"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

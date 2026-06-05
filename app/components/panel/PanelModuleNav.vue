<script setup lang="ts">
import type { PanelNavRole } from '~/data/panelNavigationCatalog'
import type { DashboardModuleLink } from '~/utils/dashboardLink'
import { resolveDashboardNavRole } from '~/utils/dashboardNavRole'
import { useRoleDashboardNav, type RoleDashboardItem } from '~/composables/useRoleDashboardNav'

export type PanelModuleGroup = {
  title: string
  items: DashboardModuleLink[]
}

const props = defineProps<{
  groups: PanelModuleGroup[]
  toneFromBg?: (bg?: string) => 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'
  /** Opcjonalny override roli; domyślnie wykrywana z trasy (`/admin`, `/trainer`, …). */
  navRole?: PanelNavRole | 'superadmin'
}>()

const auth = useAuth()
const { availableDashboards } = useRoleDashboardNav()
const { syncing: syncingMobile, syncMobileReleases } = useMobileReleaseSync()
const route = useRoute()

const resolvedNavRole = computed(() =>
  resolveDashboardNavRole(route.path, props.navRole ?? null)
)

const sourceGroups = computed(() => props.groups)

const cmsNav = useCmsDashboardNav(resolvedNavRole, sourceGroups)

const cmsEditMode = computed(() => cmsNav?.editMode.value ?? false)
const cmsSaving = computed(() => cmsNav?.saving.value ?? false)
const cmsErrorMsg = computed(() => cmsNav?.errorMsg.value ?? '')

const displayGroups = cmsNav.displayGroups

const showSuperAdminToolbar = computed(() => auth.isSuperAdmin.value)
const showNavToolbar = computed(() =>
  hasMultipleRoles.value || showSuperAdminToolbar.value || cmsNav.canEditNav.value
)

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
        class="flex flex-wrap items-center gap-2 border-b border-default/50 bg-muted/6 p-2.5 sm:p-3"
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

        <div
          v-if="cmsNav.canEditNav && resolvedNavRole"
          class="flex shrink-0 flex-wrap items-center gap-1.5"
        >
          <template v-if="!cmsEditMode">
            <UButton
              size="xs"
              variant="soft"
              color="primary"
              icon="i-lucide-grip-vertical"
              @click="cmsNav.startEdit()"
            >
              <span class="hidden sm:inline">Edytuj kolejność</span>
            </UButton>
          </template>
          <template v-else>
            <UButton
              size="xs"
              :loading="cmsSaving"
              icon="i-lucide-save"
              @click="cmsNav.saveOrder()"
            >
              Zapisz
            </UButton>
            <UButton
              size="xs"
              variant="ghost"
              @click="cmsNav.cancelEdit()"
            >
              Anuluj
            </UButton>
          </template>
        </div>

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

      <p
        v-if="cmsEditMode"
        class="border-b border-primary/20 bg-primary/5 px-4 py-2 text-xs text-primary"
      >
        Tryb edycji — przeciągnij moduły, aby zmienić kolejność. Zmiany widoczne dla wszystkich kont tej roli.
      </p>

      <p
        v-if="cmsErrorMsg"
        class="border-b border-error/20 bg-error/5 px-4 py-2 text-xs text-error"
      >
        {{ cmsErrorMsg }}
      </p>

      <div class="divide-y divide-default/40">
        <div
          v-for="(group, gi) in displayGroups"
          :key="group.title"
          class="p-3 sm:p-4"
        >
          <h3 class="mb-2.5 px-1 text-[10px] font-black uppercase tracking-[0.22em] text-muted">
            {{ group.title }}
          </h3>
          <ul class="grid grid-cols-1 gap-0.5 sm:grid-cols-2 sm:gap-1">
            <li
              v-for="(link, index) in group.items"
              :key="`${group.title}-${link.to}-${index}`"
              v-slavia-reveal="cmsEditMode ? undefined : { variant: 'fade-up', delay: gi * 40 + index * 25 }"
              :draggable="cmsEditMode || undefined"
              class="rounded-xl transition-colors"
              :class="cmsEditMode ? 'cursor-grab active:cursor-grabbing ring-1 ring-primary/20 bg-primary/5' : ''"
              @dragstart="cmsNav.onDragStart(gi, index)"
              @dragover.prevent
              @drop="cmsNav.onDrop(gi, index)"
            >
              <div
                v-if="cmsEditMode"
                class="flex items-center gap-2 px-2 pt-2"
              >
                <UIcon name="i-lucide-grip-vertical" class="size-4 shrink-0 text-muted" />
                <span class="truncate text-xs font-bold text-highlighted">{{ link.title }}</span>
              </div>
              <DashboardModuleRow
                :title="link.title"
                :description="link.description"
                :icon="link.icon"
                :to="cmsEditMode ? '#' : link.to"
                :tone="resolveTone(link)"
                :icon-wrapper-class="`${link.bg} ${link.color}`"
                :class="cmsEditMode ? 'pointer-events-none opacity-90' : ''"
              />
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

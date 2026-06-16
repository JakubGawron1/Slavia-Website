<script setup lang="ts">
import type { PanelArea } from '~/composables/useSlaviaPanelArea'
import { panelAreaFromPath } from '~/composables/useSlaviaPanelArea'

const props = defineProps<{
  area: PanelArea
}>()

const route = useRoute()
const {
  collapsed,
  mobileOpen,
  sidebarEyebrow,
  sidebarBrandIcon,
  sidebarDashboardTo,
  sidebarHomeLink,
  sidebarNavGroups,
  isSectionOpen,
  toggleSection,
  roleSwitcherShortLabel,
  resolvedBreadcrumbs,
  toggleCollapsed,
  closeMobile
} = usePanelSidebarNav()

const { availableDashboards } = useRoleDashboardNav()

const currentArea = computed(() => panelAreaFromPath(route.path))

const roleItems = computed(() =>
  availableDashboards.value.map(d => ({
    ...d,
    shortLabel: roleSwitcherShortLabel(d.area),
    active: currentArea.value === d.area
  }))
)

function isRoleActive(area: PanelArea) {
  return currentArea.value === area
}

watch(
  () => route.fullPath,
  () => closeMobile()
)
</script>

<template>
  <div
    class="slavia-panel-sidebar"
    :class="{
      'slavia-panel-sidebar--collapsed': collapsed,
      'slavia-panel-sidebar--open': mobileOpen
    }"
    :data-panel-area="props.area"
  >
    <div class="slavia-panel-sidebar__inner">
      <header
        class="slavia-panel-sidebar__head"
        :class="collapsed ? 'slavia-panel-sidebar__head--collapsed' : ''"
      >
        <NuxtLink
          :to="sidebarDashboardTo"
          class="slavia-panel-sidebar__brand group"
          :class="collapsed ? 'slavia-panel-sidebar__brand--collapsed' : ''"
          :title="collapsed ? `Slavia — ${sidebarEyebrow}` : undefined"
          @click="closeMobile"
        >
          <span class="slavia-panel-sidebar__brand-mark">
            <UIcon :name="sidebarBrandIcon" class="size-4 text-primary" />
          </span>
          <span
            class="slavia-panel-sidebar__brand-text"
            :class="collapsed ? 'slavia-panel-sidebar__brand-text--hidden' : ''"
          >
            <span class="block truncate text-sm font-black tracking-tight text-highlighted">Slavia</span>
            <span class="block truncate text-[11px] font-semibold text-primary">{{ sidebarEyebrow }}</span>
          </span>
        </NuxtLink>
        <button
          type="button"
          class="slavia-panel-sidebar__collapse slavia-panel-sidebar__collapse--desktop"
          :aria-label="collapsed ? 'Rozwiń panel nawigacji' : 'Zwiń panel nawigacji'"
          :title="collapsed ? 'Rozwiń' : 'Zwiń'"
          @click="toggleCollapsed"
        >
          <UIcon
            :name="collapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
            class="size-4"
          />
        </button>
        <button
          type="button"
          class="slavia-panel-sidebar__collapse slavia-panel-sidebar__collapse--mobile"
          aria-label="Zamknij panel nawigacji"
          @click="closeMobile"
        >
          <UIcon name="i-lucide-x" class="size-4" />
        </button>
      </header>

      <nav class="slavia-panel-sidebar__nav" aria-label="Moduły panelu">
        <PanelSidebarLink
          v-if="sidebarHomeLink"
          :title="sidebarHomeLink.title"
          :icon="sidebarHomeLink.icon"
          :to="sidebarHomeLink.to"
          :icon-wrapper-class="sidebarHomeLink.bg ? `${sidebarHomeLink.bg} ${sidebarHomeLink.color}` : null"
          :collapsed="collapsed"
          @click="closeMobile"
        />

        <template v-if="collapsed">
          <PanelSidebarLink
            v-for="item in sidebarNavGroups.flatMap(g => g.items)"
            :key="`flat-${item.to}-${item.title}`"
            :title="item.title"
            :icon="item.icon"
            :to="item.to"
            :icon-wrapper-class="item.bg ? `${item.bg} ${item.color}` : null"
            :collapsed="collapsed"
            @click="closeMobile"
          />
        </template>

        <template v-else>
          <PanelSidebarNavSection
            v-for="(group, index) in sidebarNavGroups"
            :key="group.id"
            :group="group"
            :open="isSectionOpen(group, index)"
            :collapsed="collapsed"
            @toggle="toggleSection(group)"
          />
        </template>
      </nav>

      <footer class="slavia-panel-sidebar__foot">
        <div
          v-if="roleItems.length > 1"
          class="slavia-panel-sidebar__roles"
          :class="collapsed ? 'slavia-panel-sidebar__roles--collapsed' : ''"
          aria-label="Przełącz panel roli"
        >
          <NuxtLink
            v-for="role in roleItems"
            :key="role.area"
            :to="role.to"
            class="slavia-panel-sidebar__role"
            :class="[
              isRoleActive(role.area) ? 'slavia-panel-sidebar__role--active' : '',
              collapsed ? 'slavia-panel-sidebar__role--collapsed' : ''
            ]"
            :title="collapsed ? role.label : role.shortLabel"
            :aria-label="role.label"
            @click="closeMobile"
          >
            <UIcon :name="role.icon" class="size-3.5 shrink-0" />
            <span
              class="truncate"
              :class="collapsed ? 'slavia-panel-sidebar__role-label--hidden' : ''"
            >
              {{ role.shortLabel }}
            </span>
          </NuxtLink>
        </div>

        <nav
          v-if="resolvedBreadcrumbs.length"
          class="slavia-panel-sidebar__crumb"
          :class="collapsed ? 'slavia-panel-sidebar__crumb--collapsed' : ''"
          aria-label="Ścieżka w panelu"
        >
          <ol class="slavia-panel-sidebar__crumb-list">
            <li
              v-for="(item, index) in resolvedBreadcrumbs"
              :key="`${item.label}-${index}`"
              class="slavia-panel-sidebar__crumb-item"
            >
              <UIcon
                v-if="index > 0"
                name="i-lucide-chevron-right"
                class="size-3 shrink-0 opacity-40"
                aria-hidden="true"
              />
              <NuxtLink
                v-if="item.to && index < resolvedBreadcrumbs.length - 1"
                :to="item.to"
                class="slavia-panel-sidebar__crumb-link truncate"
              >
                {{ item.label }}
              </NuxtLink>
              <span
                v-else
                class="truncate font-semibold text-highlighted"
                :aria-current="index === resolvedBreadcrumbs.length - 1 ? 'page' : undefined"
              >
                {{ item.label }}
              </span>
            </li>
          </ol>
        </nav>
      </footer>
    </div>
  </div>
</template>

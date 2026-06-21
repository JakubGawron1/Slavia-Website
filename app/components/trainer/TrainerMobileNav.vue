<script setup lang="ts">
import {
  PANEL_NAV_FLAG_PREFIX,
  PANEL_NAV_MODULES,
  panelNavNormalizePath,
  type PanelNavModuleDef
} from '~/data/panelNavigationCatalog'
import { isTrainerMobileNavMoreRoute } from '~/utils/trainerPanelRoutes'
import { panelSidebarNavTargetMatches } from '~/data/panelSidebarNavigation'

type TrainerMobileNavItem = {
  key: string
  label: string
  to: string
  icon: string
  flagId: string | null
  more?: boolean
}

const DASHBOARD_ITEM: TrainerMobileNavItem = {
  key: 'dashboard',
  label: 'Pulpit',
  to: '/trainer',
  icon: 'i-lucide-layout-dashboard',
  flagId: null
}

const MORE_ITEM: TrainerMobileNavItem = {
  key: 'wiecej',
  label: 'Więcej',
  to: '/trainer',
  icon: 'i-lucide-layout-grid',
  flagId: null,
  more: true
}

const CATALOG_SLUGS = ['wyniki', 'zawodnicy', 'skladki'] as const

const SHORT_LABELS: Record<(typeof CATALOG_SLUGS)[number], string> = {
  wyniki: 'Wyniki',
  zawodnicy: 'Zespół',
  skladki: 'Składki'
}

function trainerCatalogModule(slug: (typeof CATALOG_SLUGS)[number]): PanelNavModuleDef | undefined {
  return PANEL_NAV_MODULES.find(
    m => m.role === 'trainer' && m.id === `${PANEL_NAV_FLAG_PREFIX}trainer_${slug}`
  )
}

const route = useRoute()
const panelNav = usePanelNavigationFlags()

const navItems = computed((): TrainerMobileNavItem[] => {
  const items: TrainerMobileNavItem[] = [DASHBOARD_ITEM]

  for (const slug of CATALOG_SLUGS) {
    const mod = trainerCatalogModule(slug)
    if (!mod) continue
    if (mod.id && !panelNav.isEnabled(mod.id)) continue
    items.push({
      key: slug,
      label: SHORT_LABELS[slug],
      to: mod.to,
      icon: mod.icon,
      flagId: mod.id
    })
  }

  items.push(MORE_ITEM)
  return items
})

function isItemActive(item: TrainerMobileNavItem): boolean {
  if (item.more) return isTrainerMobileNavMoreRoute(route.path)
  if (item.key === 'dashboard') {
    return panelNavNormalizePath(route.path) === '/trainer'
  }
  return panelSidebarNavTargetMatches(route, item.to)
}
</script>

<template>
  <nav
    class="slavia-athlete-mobile-nav md:hidden"
    aria-label="Nawigacja panelu trenera"
  >
    <ul class="slavia-athlete-mobile-nav__list">
      <li
        v-for="item in navItems"
        :key="item.key"
        class="slavia-athlete-mobile-nav__item"
      >
        <NuxtLink
          :to="item.to"
          class="slavia-athlete-mobile-nav__link"
          :class="isItemActive(item) ? 'slavia-athlete-mobile-nav__link--active' : ''"
          :aria-current="isItemActive(item) ? 'page' : undefined"
        >
          <UIcon
            :name="item.icon"
            class="slavia-athlete-mobile-nav__icon"
            aria-hidden="true"
          />
          <span class="slavia-athlete-mobile-nav__label">{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

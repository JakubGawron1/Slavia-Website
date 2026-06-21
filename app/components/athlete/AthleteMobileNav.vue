<script setup lang="ts">
import {
  PANEL_NAV_FLAG_PREFIX,
  PANEL_NAV_MODULES,
  panelNavNormalizePath,
  type PanelNavModuleDef
} from '~/data/panelNavigationCatalog'
import { isAthleteMobileNavMoreRoute } from '~/utils/athletePanelRoutes'
import { panelSidebarNavTargetMatches } from '~/data/panelSidebarNavigation'

type AthleteMobileNavItem = {
  key: string
  label: string
  to: string
  icon: string
  flagId: string | null
  more?: boolean
}

const DASHBOARD_ITEM: AthleteMobileNavItem = {
  key: 'dashboard',
  label: 'Pulpit',
  to: '/athlete',
  icon: 'i-lucide-layout-dashboard',
  flagId: null
}

const MORE_ITEM: AthleteMobileNavItem = {
  key: 'wiecej',
  label: 'Więcej',
  to: '/athlete',
  icon: 'i-lucide-layout-grid',
  flagId: null,
  more: true
}

const CATALOG_SLUGS = ['wyniki', 'kalendarz', 'skladki'] as const

const SHORT_LABELS: Record<(typeof CATALOG_SLUGS)[number], string> = {
  wyniki: 'Wyniki',
  kalendarz: 'Kalendarz',
  skladki: 'Składki'
}

function athleteCatalogModule(slug: (typeof CATALOG_SLUGS)[number]): PanelNavModuleDef | undefined {
  return PANEL_NAV_MODULES.find(
    m => m.role === 'athlete' && m.id === `${PANEL_NAV_FLAG_PREFIX}athlete_${slug}`
  )
}

const route = useRoute()
const panelNav = usePanelNavigationFlags()

const navItems = computed((): AthleteMobileNavItem[] => {
  const items: AthleteMobileNavItem[] = [DASHBOARD_ITEM]

  for (const slug of CATALOG_SLUGS) {
    const mod = athleteCatalogModule(slug)
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

function isItemActive(item: AthleteMobileNavItem): boolean {
  if (item.more) return isAthleteMobileNavMoreRoute(route.path)
  if (item.key === 'dashboard') {
    return panelNavNormalizePath(route.path) === '/athlete'
  }
  return panelSidebarNavTargetMatches(route, item.to)
}
</script>

<template>
  <nav
    class="slavia-athlete-mobile-nav md:hidden"
    aria-label="Nawigacja panelu zawodnika"
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

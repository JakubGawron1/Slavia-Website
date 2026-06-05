/** Hydracja widoczności modułów panelu z backendu (feature_flags panel_nav_*). */
export default defineNuxtPlugin({
  name: 'slavia-panel-nav-bootstrap',
  async setup() {
    if (!import.meta.client) return
    const panelNav = usePanelNavigationFlags()
    await panelNav.hydrateFromApi()
  }
})

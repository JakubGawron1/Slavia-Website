/** Hydracja widoczności modułów panelu z backendu (feature_flags panel_nav_*) — w tle po logowaniu. */
export default defineNuxtPlugin({
  name: 'slavia-panel-nav-bootstrap',
  setup() {
    if (!import.meta.client) return
    const auth = useAuth()
    if (!auth.token.value) return
    const panelNav = usePanelNavigationFlags()
    void panelNav.hydrateFromApi()
  }
})

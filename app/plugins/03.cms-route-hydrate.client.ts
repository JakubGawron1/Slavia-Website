/** Hydracja treści CMS per trasa + zmienne dla edytorów. */
export default defineNuxtPlugin(() => {
  const route = useRoute()
  const auth = useAuth()
  const cms = useCms()

  async function hydrateRoutePage(path: string) {
    if (isCmsExcludedPath(path)) return
    const pageName = cmsRoutePageName(path)
    if (!cms.pages.value[pageName]) {
      await cms.fetchPagePublic(pageName)
    }
  }

  watch(
    () => route.path,
    (path) => {
      void hydrateRoutePage(path)
    },
    { immediate: true }
  )

  watch(
    () => auth.token.value,
    (token) => {
      if (!token) {
        if (cms.editMode.value) cms.setEditMode(false)
        return
      }
      void cms.hydratePublic(false, { variables: true, navigation: false })
      cms.restoreEditModeFromStorage()
    },
    { immediate: true }
  )
})

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    },
    header: {
      slots: {
        center:
          'hidden lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-center lg:overflow-x-auto lg:px-1'
      }
    },
    dropdownMenu: {
      slots: {
        content:
          'z-[900] rounded-xl border border-default/50 bg-elevated/95 p-1 shadow-lg ring-1 ring-default/25 backdrop-blur-xl dark:shadow-black/30'
      }
    },
    drawer: {
      slots: {
        content: 'bg-background/95 backdrop-blur-xl ring-1 ring-default/30'
      }
    },
    /** Listy USelect w modalach — ponad overlay; w sheecie portal jest lokalny (z-25 zakładek). */
    select: {
      slots: {
        content: 'z-[700] pointer-events-auto'
      }
    }
  }
})

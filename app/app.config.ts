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
    button: {
      slots: {
        base:
          'rounded-xl font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98]'
      },
      variants: {
        solid: {
          base: 'shadow-sm hover:shadow-md'
        }
      }
    },
    input: {
      slots: {
        base:
          'rounded-xl ring-1 ring-default/50 transition-[box-shadow,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-primary/40'
      }
    },
    textarea: {
      slots: {
        base:
          'rounded-xl ring-1 ring-default/50 transition-[box-shadow,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-primary/40'
      }
    },
    card: {
      slots: {
        root:
          'rounded-2xl ring-1 ring-default/25 shadow-sm transition-[border-color,box-shadow] duration-200'
      }
    },
    badge: {
      slots: {
        base: 'rounded-lg font-semibold'
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
        content: 'z-[700] pointer-events-auto rounded-xl shadow-lg ring-1 ring-default/25'
      }
    },
    modal: {
      slots: {
        content: 'rounded-2xl shadow-xl ring-1 ring-default/30'
      }
    }
  }
})

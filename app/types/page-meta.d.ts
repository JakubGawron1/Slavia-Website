declare module '#app' {
  interface PageMeta {
    /** Jawny cel przycisku „wstecz” w nagłówku. */
    backTo?: string
    /** Etykieta ARIA (domyślnie „Wróć”). */
    backLabel?: string
    /** Ukryj przycisk wstecz mimo domyślnej logiki. */
    hideBack?: boolean
  }
}

export {}

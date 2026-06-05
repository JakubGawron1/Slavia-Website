export default {
  scrollBehavior(to: { hash?: string }) {
    // Obsługa kotwic `#hash` dla kafelków / menu paneli.
    // Nuxt domyślnie potrafi tego nie przewijać w części przypadków (np. zmiana samego hasha).
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    return { top: 0 }
  }
}


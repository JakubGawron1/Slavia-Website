/**
 * Stub dla `/dev-sw.js` — przeglądarka ze starą rejestracją dev SW odpytuje ten URL.
 * Bez tego żądanie trafia w SSR do Vue Routera (ostrzeżenie „No match found”).
 * PWA w dev jest wyłączone (`config/pwa.ts` → devOptions.enabled: false).
 */
export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'application/javascript; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return `// Slavia PWA: dev service worker disabled (see config/pwa.ts devOptions.enabled)
self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => {
  e.waitUntil(
    self.registration.unregister().then(() => self.clients.matchAll()).then((clients) => {
      clients.forEach((client) => client.navigate(client.url))
    })
  );
});
`
})

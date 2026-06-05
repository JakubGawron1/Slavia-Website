export const prerenderRoutes = [
  '/',
  '/zawodnicy',
  '/zawodnicy/archiwum',
  '/galeria',
  '/aktualnosci',
  '/kalendarz',
  '/kontakt',
  '/logowanie',
  '/kalkulator-proporcji',
  '/kalkulator-sinclair',
  '/kalkulator-max-pr',
  '/klub/wyzwania',
  '/o-klubie'
] as const

export const prerenderIgnore = [
  '/athlete',
  '/athlete/**',
  '/trainer',
  '/trainer/**',
  '/admin',
  '/admin/**',
  '/superadmin',
  '/superadmin/**',
  '/chat',
  '/profil',
  '/attendance',
  '/powiadomienia',
  '/dziennik',
  '/dziennik/**',
  '/ogloszenia',
  '/api',
  '/dev-sw.js'
] as const

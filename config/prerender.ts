import { KLUB_SHARED_ROUTES } from '../app/config/klubRoutes'

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
  KLUB_SHARED_ROUTES.wyzwania,
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
  '/ogloszenia',
  `${KLUB_SHARED_ROUTES.czat}`,
  `${KLUB_SHARED_ROUTES.obecnosc}`,
  `${KLUB_SHARED_ROUTES.powiadomienia}`,
  '/api',
  '/dev-sw.js'
] as const

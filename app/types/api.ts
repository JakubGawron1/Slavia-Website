/**
 * Most typów API — migracja z ręcznego `models.ts` do OpenAPI.
 *
 * Źródło kontraktu: `Slavia-shared/openapi/openapi.json` (submodule, CI/Vercel) lub backend lokalnie.
 * Po zmianie backendu: `pnpm openapi:snapshot` → `pnpm openapi:types` → commit Slavia-shared + generated.
 *
 * Gdy backend opublikuje `components.schemas`, aliasy poniżej podmieniamy na `components['schemas']['…']`.
 */
import type { components, paths } from '~/types/generated/openapi.types'

/** Ścieżki z operacją GET w embed OpenAPI. */
export type PublicOpenApiGetPath = {
  [K in keyof paths]: paths[K] extends { get: unknown } ? K : never
}[keyof paths]

/** @deprecated Użyj PublicOpenApiGetPath */
export type PublicOpenApiPath = PublicOpenApiGetPath

/** Przygotowane pod przyszłe schematy — dziś `schemas: never`. */
export type OpenApiSchemas = components['schemas']

export type { paths, components }

/** Re-eksport domenowych typów — stopniowo zastępowane schematami OpenAPI. */
export type {
  Athlete,
  AthletePublicProfile,
  AuthUser,
  Competition,
  CompetitionResult,
  LoginResponse,
  RecoveryLog,
  UserRole
} from '~/types/models'

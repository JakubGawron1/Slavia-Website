/** Publiczny ranking Sinclair — kontrakt API `GET /api/athletes/ranking/sinclair`. */
export interface SinclairRankingRow {
  athlete_id: string
  full_name: string
  gender?: string | null
  bodyweight_kg?: number | null
  total_kg?: number | null
  sinclair_total?: number | null
}

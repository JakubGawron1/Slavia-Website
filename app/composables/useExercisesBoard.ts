import { apiRoutes } from '~/config/api'
import type { ExerciseBoardRowV2 } from '~/types/models'

export function useExercisesBoard() {
  const apiFetch = useApi()

  async function fetchBoard(exerciseId: string): Promise<ExerciseBoardRowV2[]> {
    if (!exerciseId) return []
    return apiFetch<ExerciseBoardRowV2[]>(apiRoutes.exerciseSubmissions.board(exerciseId)).catch(() => [])
  }

  return {
    fetchBoard
  }
}

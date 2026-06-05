import type { usePlayersManagerEditor } from '~/composables/usePlayersManagerEditor'

export type PlayersEditorContext = ReturnType<typeof usePlayersManagerEditor>

export const PLAYERS_EDITOR_KEY: InjectionKey<PlayersEditorContext> = Symbol('players-editor')

export function usePlayersEditorContext() {
  const ctx = inject(PLAYERS_EDITOR_KEY)
  if (!ctx) throw new Error('usePlayersEditorContext wymaga provide w PlayersManager')
  return ctx
}

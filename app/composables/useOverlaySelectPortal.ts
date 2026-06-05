import type { Ref } from 'vue'

export const editorSheetPortalKey: InjectionKey<Ref<HTMLElement | null>> = Symbol('slavia-editor-sheet-portal')
export const modalPortalKey: InjectionKey<Ref<HTMLElement | null>> = Symbol('slavia-modal-portal')

/** Cel portalu USelect — sheet → modal → body (Nuxt UI domyślnie). */
export function useOverlaySelectPortal() {
  const sheetAnchor = inject(editorSheetPortalKey, null)
  const modalAnchor = inject(modalPortalKey, null)
  return computed(() => sheetAnchor?.value ?? modalAnchor?.value ?? undefined)
}

/** @deprecated Użyj useOverlaySelectPortal */
export function useEditorSheetPortal() {
  return useOverlaySelectPortal()
}

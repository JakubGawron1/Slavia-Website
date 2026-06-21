import { useWindowVirtualizer } from '@tanstack/vue-virtual'
import type { ComputedRef, Ref } from 'vue'

/** Zgodne z `.slavia-public-grid` w `_public.scss` (768px → 2 kolumny, 1024px → 3). */
const GRID_MD_MQ = '(min-width: 768px)'
const GRID_LG_MQ = '(min-width: 1024px)'

export function usePublicGridColumns() {
  const columns = ref(1)

  if (import.meta.client) {
    onMounted(() => {
      const md = window.matchMedia(GRID_MD_MQ)
      const lg = window.matchMedia(GRID_LG_MQ)
      const sync = () => {
        columns.value = lg.matches ? 3 : md.matches ? 2 : 1
      }
      sync()
      md.addEventListener('change', sync)
      lg.addEventListener('change', sync)
      onUnmounted(() => {
        md.removeEventListener('change', sync)
        lg.removeEventListener('change', sync)
      })
    })
  }

  return columns
}

export interface VirtualScrollGridOptions<T> {
  items: ComputedRef<readonly T[]>
  enabled: ComputedRef<boolean>
  columns: Ref<number> | ComputedRef<number>
  listRef: Ref<HTMLElement | null>
  estimateRowSize?: number
  overscan?: number
}

/** Window-scroll grid windowing — wiersze siatki (N kart na wiersz). */
export function useVirtualScrollGrid<T>(options: VirtualScrollGridOptions<T>) {
  const estimateRowSize = options.estimateRowSize ?? 460
  const overscan = options.overscan ?? 2
  const scrollMargin = ref(0)

  const rowCount = computed(() => {
    if (!options.enabled.value) return 0
    const cols = Math.max(1, options.columns.value)
    return Math.ceil(options.items.value.length / cols)
  })

  function updateScrollMargin() {
    const el = options.listRef.value
    if (!el || !import.meta.client) {
      scrollMargin.value = 0
      return
    }
    scrollMargin.value = el.getBoundingClientRect().top + window.scrollY
  }

  watch([options.listRef, rowCount, options.enabled], () => nextTick(updateScrollMargin), {
    flush: 'post'
  })

  onMounted(() => {
    updateScrollMargin()
    window.addEventListener('resize', updateScrollMargin)
    onUnmounted(() => window.removeEventListener('resize', updateScrollMargin))
  })

  const virtualizer = useWindowVirtualizer(
    computed(() => ({
      count: options.enabled.value ? rowCount.value : 0,
      estimateSize: () => estimateRowSize,
      overscan,
      scrollMargin: scrollMargin.value
    }))
  )

  const virtualRows = computed(() => virtualizer.value.getVirtualItems())

  const paddingTop = computed(() => virtualRows.value[0]?.start ?? 0)

  const paddingBottom = computed(() => {
    const items = virtualRows.value
    if (items.length === 0) return 0
    const last = items[items.length - 1]
    return virtualizer.value.getTotalSize() - (last?.end ?? 0)
  })

  function rowItems(rowIndex: number): T[] {
    const cols = Math.max(1, options.columns.value)
    const start = rowIndex * cols
    return options.items.value.slice(start, start + cols) as T[]
  }

  return {
    virtualRows,
    paddingTop,
    paddingBottom,
    rowItems,
    rowCount,
    updateScrollMargin
  }
}

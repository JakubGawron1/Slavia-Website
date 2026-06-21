import { useVirtualizer } from '@tanstack/vue-virtual'
import type { ComputedRef, Ref } from 'vue'

export interface VirtualScrollRowsOptions {
  scrollRef: Ref<HTMLElement | null>
  count: ComputedRef<number>
  estimateSize?: number
  overscan?: number
}

/** Padding-based windowing for long lists (tables, div stacks). */
export function useVirtualScrollRows(options: VirtualScrollRowsOptions) {
  const estimateSize = options.estimateSize ?? 52
  const overscan = options.overscan ?? 10

  const virtualizer = useVirtualizer(
    computed(() => ({
      count: options.count.value,
      getScrollElement: () => options.scrollRef.value,
      estimateSize: () => estimateSize,
      overscan
    }))
  )

  const virtualItems = computed(() => virtualizer.value.getVirtualItems())

  const paddingTop = computed(() => virtualItems.value[0]?.start ?? 0)

  const paddingBottom = computed(() => {
    const items = virtualItems.value
    if (items.length === 0) return 0
    const last = items[items.length - 1]
    return virtualizer.value.getTotalSize() - (last?.end ?? 0)
  })

  function scrollToTop() {
    options.scrollRef.value?.scrollTo({ top: 0 })
  }

  return {
    virtualItems,
    paddingTop,
    paddingBottom,
    scrollToTop,
    virtualizer
  }
}

<script setup lang="ts">
import type { CompetitionResult } from '~/types/models'

const props = defineProps<{
  rows: CompetitionResult[]
  nameById: Map<string, string>
  rowSinclair: (r: CompetitionResult) => number | null
  badgeColorForKind: (k: string | undefined) => 'info' | 'neutral' | 'primary'
}>()

const emit = defineEmits<{
  edit: [row: CompetitionResult]
  remove: [row: CompetitionResult]
}>()

const copy = useSlaviaCopy()
const scrollRef = ref<HTMLElement | null>(null)
const rowCount = computed(() => props.rows.length)

const { virtualItems, paddingTop, paddingBottom } = useVirtualScrollRows({
  scrollRef,
  count: rowCount,
  estimateSize: 52,
  overscan: 12
})

const windowRows = computed(() =>
  virtualItems.value.map((virtualRow) => ({
    virtualRow,
    row: props.rows[virtualRow.index]!
  }))
)
</script>

<template>
  <div
    ref="scrollRef"
    class="max-h-[min(70vh,48rem)] overflow-auto overscroll-contain"
  >
    <table class="w-full min-w-[920px] text-sm">
      <thead class="sticky top-0 z-10 border-b border-default bg-muted/30 backdrop-blur-sm">
        <tr>
          <th class="px-4 py-3 text-left font-semibold text-muted">
            Data
          </th>
          <th class="px-4 py-3 text-left font-semibold text-muted">
            Typ
          </th>
          <th class="px-4 py-3 text-left font-semibold text-muted">
            Zawodnik
          </th>
          <th class="px-4 py-3 text-left font-semibold text-muted">
            Miejsce
          </th>
          <th class="px-4 py-3 text-right font-semibold text-muted">
            Rwanie
          </th>
          <th class="px-4 py-3 text-right font-semibold text-muted">
            Podrzut
          </th>
          <th class="px-4 py-3 text-right font-semibold text-muted">
            Razem
          </th>
          <th class="px-4 py-3 text-right font-semibold text-muted">
            Sinclair
          </th>
          <th class="px-4 py-3 text-left font-semibold text-muted">
            Status
          </th>
          <th class="px-4 py-3 text-right font-semibold text-muted">
            Akcje
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-if="rows.length === 0">
          <td
            colspan="10"
            class="px-4 py-6"
          >
            <SlaviaEmptyState
              icon="i-lucide-trophy"
              title="Brak wyników"
              description="Brak zapisanych wyników w tym filtrze."
            />
          </td>
        </tr>
        <template v-else>
          <tr
            v-if="paddingTop > 0"
            aria-hidden="true"
            class="pointer-events-none border-0"
          >
            <td
              :colspan="10"
              :style="{ height: `${paddingTop}px`, padding: 0, border: 0 }"
            />
          </tr>
          <tr
            v-for="{ row: r } in windowRows"
            :key="r.id"
            class="transition-colors hover:bg-muted/15"
          >
            <td class="px-4 py-3 whitespace-nowrap">
              {{ r.date.slice(0, 10) }}
            </td>
            <td class="px-4 py-3">
              <UBadge
                :color="badgeColorForKind(r.kind)"
                variant="subtle"
                size="sm"
              >
                {{ copy.resultKindLabel(r.kind) }}
              </UBadge>
            </td>
            <td class="px-4 py-3">
              {{ nameById.get(r.athlete_id) || r.athlete_id }}
            </td>
            <td class="px-4 py-3 text-muted">
              <span v-if="r.location">
                {{ r.location }}
              </span>
              <span v-else class="text-muted/60">—</span>
            </td>
            <td class="px-4 py-3 text-right tabular-nums">
              {{ r.snatch }}
            </td>
            <td class="px-4 py-3 text-right tabular-nums">
              {{ r.clean_and_jerk }}
            </td>
            <td class="px-4 py-3 text-right font-semibold tabular-nums">
              {{ r.total }}
            </td>
            <td class="px-4 py-3 text-right">
              <span
                v-if="rowSinclair(r) != null"
                class="inline-block rounded-full bg-primary/15 px-2 py-1 font-mono text-xs font-black text-primary"
              >
                {{ rowSinclair(r) }}
              </span>
              <span v-else class="text-muted/60">—</span>
            </td>
            <td class="px-4 py-3">
              <UBadge
                :color="r.status === 'Approved' ? 'success' : (r.status === 'Rejected' ? 'error' : 'warning')"
                variant="subtle"
              >
                {{ copy.resultStatusLabel(r.status) }}
              </UBadge>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-1">
                <UButton
                  size="xs"
                  variant="soft"
                  icon="i-lucide-pencil"
                  @click="emit('edit', r)"
                />
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  @click="emit('remove', r)"
                />
              </div>
            </td>
          </tr>
          <tr
            v-if="paddingBottom > 0"
            aria-hidden="true"
            class="pointer-events-none border-0"
          >
            <td
              :colspan="10"
              :style="{ height: `${paddingBottom}px`, padding: 0, border: 0 }"
            />
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

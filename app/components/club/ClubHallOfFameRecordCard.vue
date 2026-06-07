<script setup lang="ts">
import AthleteProgressChart, { type AthleteChartPoint } from '~/components/AthleteProgressChart.vue'
import { athleteProfilePath } from '~/utils/slug'

export interface ClubHallOfFameRecordCardTrainingStrip {
  snatch: number
  cleanAndJerk: number
  total: number
  sinclair: number
}

export interface ClubHallOfFameRecordCardData {
  athleteId: string
  name: string
  weightCategoryText: string
  birthYear: number | null
  bodyweight: number | null
  photo?: string
  tagline?: string
  total: number
  snatch: number
  cleanJerk: number
  sinclair: number
  resultDate: string | null
  chartHistory: AthleteChartPoint[]
  usesProfileFallback: boolean
  chartCaption: string
  chartKey: string
  statsTitle?: string
  statsSubtitle?: string
  dateLabel?: string
  trainingStrip?: ClubHallOfFameRecordCardTrainingStrip | null
  membershipPaid?: boolean | null
  hasStandingOrder?: boolean
  isActive?: boolean
}

const props = defineProps<{
  record: ClubHallOfFameRecordCardData
}>()

const profileTo = computed(() =>
  athleteProfilePath(props.record.name, props.record.athleteId)
)

const statsTitle = computed(() => props.record.statsTitle ?? 'Rekord klubu')
const statsSubtitle = computed(() => props.record.statsSubtitle ?? 'Oficjalne PB w kategorii')
const dateLabel = computed(() => props.record.dateLabel ?? 'Rekord')

const membershipBadgeLabel = computed(() => {
  const r = props.record
  if (r.membershipPaid === true) return 'Opłacony'
  if (r.hasStandingOrder === true) return 'Przelew stały'
  return 'Nieopłacony'
})

const membershipBadgeColor = computed(() => {
  const r = props.record
  if (r.membershipPaid === true) return 'success' as const
  if (r.hasStandingOrder === true) return 'info' as const
  return 'error' as const
})

const showMembershipBadge = computed(() =>
  props.record.membershipPaid !== undefined && props.record.membershipPaid !== null
)

function fmtPlDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = iso.slice(0, 10)
  if (d.length < 10) return iso
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}
</script>

<template>
  <UCard
    class="group/card h-full overflow-visible rounded-xl border border-default/55 bg-card text-default shadow-sm ring-1 ring-default/15 transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md hover:ring-primary/20 dark:border-default/45 dark:bg-card dark:ring-default/15 dark:hover:border-primary/40 dark:hover:ring-primary/25"
    :ui="{ body: 'p-0' }"
  >
    <NuxtLink
      :to="profileTo"
      class="block border-b border-default/45 bg-muted/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset dark:border-default/50 dark:bg-muted/15"
    >
      <div class="flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-4 sm:p-4">
        <div
          class="mx-auto size-24 shrink-0 overflow-hidden rounded-xl bg-muted/25 ring-2 ring-default/20 sm:mx-0 sm:size-28 dark:bg-muted/30 dark:ring-default/35"
        >
          <img
            :src="record.photo || '/athlete-placeholder.svg'"
            :alt="record.name"
            width="112"
            height="112"
            loading="lazy"
            decoding="async"
            class="block size-full object-cover object-[50%_15%] transition duration-200 group-hover/card:scale-[1.03]"
          >
        </div>

        <div class="min-w-0 flex-1 text-center sm:text-left">
          <h3 class="text-balance text-lg font-bold leading-tight tracking-tight text-highlighted sm:text-xl">
            {{ record.name }}
          </h3>
          <p
            v-if="record.birthYear || record.bodyweight"
            class="mt-0.5 text-xs text-muted sm:text-sm"
          >
            <span v-if="record.birthYear">Rocznik {{ record.birthYear }}</span>
            <span v-if="record.birthYear && record.bodyweight"> · </span>
            <span v-if="record.bodyweight">{{ record.bodyweight }} kg</span>
          </p>
          <div class="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
            <UBadge color="primary" variant="subtle" size="sm" class="font-medium">
              Kat. {{ record.weightCategoryText }} kg
            </UBadge>
            <UBadge
              v-if="showMembershipBadge"
              :color="membershipBadgeColor"
              variant="subtle"
              size="sm"
            >
              {{ membershipBadgeLabel }}
            </UBadge>
          </div>
        </div>
      </div>
    </NuxtLink>

    <div class="p-3 sm:p-4">
      <div
        v-if="record.isActive === false"
        class="mb-3 rounded-lg border border-warning/35 bg-warning/6 px-3 py-2 dark:border-warning/40 dark:bg-warning/12"
      >
        <UBadge color="warning" variant="subtle" size="sm">
          Nieaktywny w kadrze
        </UBadge>
        <p class="mt-1 text-[11px] leading-snug text-muted">
          Ukryty na liście publicznej.
        </p>
      </div>

      <p
        v-if="record.tagline"
        class="mb-3 line-clamp-2 text-xs leading-relaxed text-muted sm:text-sm"
      >
        {{ record.tagline }}
      </p>

      <div class="border-b border-default/40 dark:border-default/45">
        <div class="flex items-center gap-2 border-l-4 border-primary bg-primary/5 px-2.5 py-1.5 dark:bg-primary/10">
          <UIcon name="i-lucide-trophy" class="size-3.5 shrink-0 text-primary" />
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase tracking-wide text-highlighted">
              {{ statsTitle }}
            </p>
            <p class="text-[10px] text-muted">
              {{ statsSubtitle }}
            </p>
          </div>
        </div>
        <div class="grid min-w-0 grid-cols-2 divide-x divide-y divide-default/35 bg-muted/10 sm:grid-cols-4 sm:divide-y-0 dark:divide-default/45 dark:bg-muted/20">
          <div class="flex min-h-18 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-1.5 py-2 text-center dark:bg-elevated/50">
            <UIcon name="i-game-icons-weight-lifting-up" class="size-3.5 text-primary" />
            <span class="text-[9px] font-medium uppercase tracking-wide text-muted">Rwanie</span>
            <span class="min-w-0 truncate font-mono text-base font-bold tabular-nums text-highlighted">{{ record.snatch }}</span>
            <span class="text-[9px] text-muted">kg</span>
          </div>
          <div class="flex min-h-18 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-1.5 py-2 text-center dark:bg-elevated/50">
            <UIcon name="i-game-icons-weight-lifting-down" class="size-3.5 text-primary" />
            <span class="text-[9px] font-medium uppercase tracking-wide text-muted">Podrzut</span>
            <span class="min-w-0 truncate font-mono text-base font-bold tabular-nums text-highlighted">{{ record.cleanJerk }}</span>
            <span class="text-[9px] text-muted">kg</span>
          </div>
          <div class="flex min-h-18 min-w-0 flex-col items-center justify-center gap-0.5 bg-primary/10 px-1.5 py-2 text-center dark:bg-primary/15">
            <span class="text-[9px] font-bold uppercase tracking-wide text-primary">Total</span>
            <span class="min-w-0 truncate font-mono text-base font-bold tabular-nums text-highlighted">{{ record.total }}</span>
            <span class="text-[9px] text-muted">kg</span>
          </div>
          <div class="flex min-h-18 min-w-0 flex-col items-center justify-center gap-0.5 bg-warning/8 px-1.5 py-2 text-center dark:bg-warning/12">
            <span class="text-[9px] font-bold uppercase tracking-wide text-warning">Sinclair</span>
            <span class="min-w-0 truncate font-mono text-base font-bold tabular-nums text-highlighted">{{ record.sinclair || '—' }}</span>
            <span class="text-[9px] text-muted">pkt</span>
          </div>
        </div>
      </div>

      <div
        v-if="record.trainingStrip"
        class="border-b border-default/40 dark:border-default/45"
      >
        <div class="flex items-center gap-2 border-l-4 border-info bg-info/6 px-2.5 py-1.5 dark:bg-info/12">
          <UIcon name="i-lucide-dumbbell" class="size-3.5 shrink-0 text-info" />
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase tracking-wide text-highlighted">
              Trening
            </p>
            <p class="text-[10px] text-muted">
              Sala — najlepszy zapisany wynik
            </p>
          </div>
        </div>
        <div class="grid min-w-0 grid-cols-2 divide-x divide-y divide-default/35 bg-muted/10 sm:grid-cols-4 sm:divide-y-0 dark:divide-default/45 dark:bg-muted/20">
          <div class="flex min-h-18 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-1.5 py-2 text-center dark:bg-elevated/50">
            <UIcon name="i-game-icons-weight-lifting-up" class="size-3.5 text-info" />
            <span class="text-[9px] font-medium uppercase tracking-wide text-muted">Rwanie</span>
            <span class="min-w-0 truncate font-mono text-base font-bold tabular-nums text-highlighted">{{ record.trainingStrip.snatch }}</span>
            <span class="text-[9px] text-muted">kg</span>
          </div>
          <div class="flex min-h-18 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-1.5 py-2 text-center dark:bg-elevated/50">
            <UIcon name="i-game-icons-weight-lifting-down" class="size-3.5 text-info" />
            <span class="text-[9px] font-medium uppercase tracking-wide text-muted">Podrzut</span>
            <span class="min-w-0 truncate font-mono text-base font-bold tabular-nums text-highlighted">{{ record.trainingStrip.cleanAndJerk }}</span>
            <span class="text-[9px] text-muted">kg</span>
          </div>
          <div class="flex min-h-18 min-w-0 flex-col items-center justify-center gap-0.5 bg-info/10 px-1.5 py-2 text-center dark:bg-info/15">
            <span class="text-[9px] font-bold uppercase tracking-wide text-info">Total</span>
            <span class="min-w-0 truncate font-mono text-base font-bold tabular-nums text-highlighted">{{ record.trainingStrip.total }}</span>
            <span class="text-[9px] text-muted">kg</span>
          </div>
          <div class="flex min-h-18 min-w-0 flex-col items-center justify-center gap-0.5 bg-elevated/75 px-1.5 py-2 text-center dark:bg-elevated/50">
            <span class="text-[9px] font-medium uppercase tracking-wide text-muted">Sinclair</span>
            <span class="min-w-0 truncate font-mono text-base font-bold tabular-nums text-highlighted">{{ record.trainingStrip.sinclair }}</span>
            <span class="text-[9px] text-muted">pkt</span>
          </div>
        </div>
      </div>

      <div class="border-t border-default/35 bg-muted/8 pt-3 dark:border-default/45 dark:bg-muted/12">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p class="flex items-center gap-1.5 text-xs font-semibold text-highlighted">
            <UIcon name="i-lucide-trending-up" class="size-3.5 text-primary" />
            {{ record.chartCaption }}
          </p>
          <p class="text-[10px] text-muted">
            {{ record.chartHistory.length }} {{ record.chartHistory.length === 1 ? 'start' : 'startów' }}
          </p>
        </div>
        <AthleteProgressChart
          :series="record.chartHistory"
          :chart-key="record.chartKey"
          :height="96"
        />
      </div>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <span
          v-if="record.resultDate"
          class="inline-flex items-center gap-1"
        >
          <UIcon name="i-lucide-calendar" class="size-3 shrink-0" />
          {{ dateLabel }}: {{ fmtPlDate(record.resultDate) }}
        </span>
        <span
          v-else-if="record.usesProfileFallback"
          class="inline-flex items-center gap-1 italic"
        >
          <UIcon name="i-lucide-database" class="size-3 shrink-0" />
          PB z profilu kadry
        </span>
        <UButton
          size="xs"
          variant="link"
          color="primary"
          :to="profileTo"
          trailing-icon="i-lucide-arrow-right"
          class="px-0"
        >
          Profil
        </UButton>
      </div>
    </div>
  </UCard>
</template>

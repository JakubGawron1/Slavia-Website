<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

type Tone = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon: string
    tone?: Tone
    hint?: string | null
    to?: RouteLocationRaw | string
    /** Kompaktowy wariant na dashboardzie zawodnika */
    size?: 'default' | 'compact'
    /** Trwa pobieranie danych KPI — szkielet zamiast wartości (mniej CLS). */
    loading?: boolean
    /** Błąd sieci/API — subtelny stan error + opcjonalny retry */
    failed?: boolean
    /** Krótki komunikat przy failed (domyślnie ogólny) */
    errorHint?: string | null
    /** Etykieta przycisku ponowienia */
    retryLabel?: string
  }>(),
  {
    tone: undefined,
    hint: undefined,
    to: undefined,
    size: 'default',
    loading: false,
    failed: false,
    errorHint: undefined,
    retryLabel: 'Spróbuj ponownie'
  }
)

const emit = defineEmits<{
  retry: []
}>()

const rootTag = computed(() => (props.loading || props.failed ? 'div' : props.to ? 'NuxtLink' : 'div'))

const displayTone = computed<Tone>(() => {
  if (props.failed) return 'error'
  if (props.loading) return 'info'
  return props.tone ?? 'neutral'
})

function onRetryClick(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  emit('retry')
}

const iconClass = computed(() => {
  const tone = displayTone.value
  if (tone === 'primary') return 'bg-primary/12 text-primary ring-primary/20'
  if (tone === 'success') return 'bg-success/15 text-success ring-success/25'
  if (tone === 'warning') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/20'
  if (tone === 'error') return 'bg-red-500/15 text-red-600 dark:text-red-400 ring-red-500/20'
  if (tone === 'info') return 'bg-info/14 text-info ring-info/22'
  return 'bg-muted/30 text-highlighted ring-default/30'
})

const valueSkeletonHeight = computed(() => (props.size === 'compact' ? '1.75rem' : '2rem'))
const valueSkeletonWidth = computed(() => (props.size === 'compact' ? '4.5rem' : '5.5rem'))
const hintSkeletonHeight = computed(() => (props.size === 'compact' ? '0.625rem' : '0.6875rem'))
const iconSkeletonSize = computed(() => (props.size === 'compact' ? '1.25rem' : '1.5rem'))
</script>

<template>
  <component
    :is="rootTag"
    :to="!loading && !failed && to ? to : undefined"
    class="block h-full min-h-0 focus:outline-none"
    :aria-busy="loading ? 'true' : undefined"
    :aria-label="loading ? `${label} — ładowanie` : undefined"
  >
    <UCard
      class="h-full min-h-0 rounded-2xl border-default/70 shadow-sm ring-1 ring-default/30 transition-all duration-200"
      :class="[
        to && !failed && !loading ? 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/25 hover:bg-muted/10 hover:shadow-md' : '',
        failed ? 'border-error/25 bg-error/5 ring-error/15' : '',
        size === 'compact' ? 'p-0' : ''
      ]"
      :ui="size === 'compact' ? { body: 'p-3 sm:p-3.5' } : undefined"
    >
      <div
        class="flex gap-3"
        :class="size === 'compact' ? 'items-center' : 'items-start gap-4 sm:items-center'"
      >
        <div
          class="flex shrink-0 items-center justify-center rounded-xl ring-1"
          :class="[
            loading ? 'bg-muted/25 ring-default/25' : iconClass,
            size === 'compact' ? 'size-9' : 'h-12 w-12'
          ]"
        >
          <UIcon
            v-if="!loading"
            :name="icon"
            :class="size === 'compact' ? 'size-4' : 'size-6'"
          />
          <SlaviaSkeleton
            v-else
            variant="rect"
            :width="iconSkeletonSize"
            :height="iconSkeletonSize"
            wrapper-class="rounded-md"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="font-bold uppercase tracking-wider text-muted"
            :class="size === 'compact' ? 'text-[10px]' : 'text-[11px]'"
          >
            {{ label }}
          </p>
          <SlaviaSkeleton
            v-if="loading"
            variant="title"
            :width="valueSkeletonWidth"
            :height="valueSkeletonHeight"
            wrapper-class="mt-0.5 max-w-[72%]"
          />
          <p
            v-else
            class="truncate font-black tabular-nums text-highlighted"
            :class="size === 'compact' ? 'text-xl' : 'text-2xl'"
          >
            {{ value }}
          </p>
          <SlaviaSkeleton
            v-if="loading"
            variant="text"
            width="88%"
            :height="hintSkeletonHeight"
            wrapper-class="mt-1"
          />
          <p
            v-else-if="failed"
            class="line-clamp-2 text-error/90"
            :class="size === 'compact' ? 'mt-0.5 text-[10px] leading-snug' : 'mt-0.5 line-clamp-1 text-[11px]'"
          >
            {{ errorHint ?? 'Nie udało się załadować — spróbuj ponownie' }}
          </p>
          <p
            v-else-if="hint"
            class="line-clamp-2 text-muted"
            :class="size === 'compact' ? 'mt-0.5 text-[10px] leading-snug' : 'mt-0.5 line-clamp-1 text-[11px]'"
          >
            {{ hint }}
          </p>
          <span
            v-else-if="size === 'compact'"
            class="mt-0.5 block text-[10px] leading-snug"
            aria-hidden="true"
          >&nbsp;</span>
          <UButton
            v-if="failed"
            size="xs"
            variant="soft"
            color="error"
            class="mt-1.5"
            @click="onRetryClick"
          >
            {{ retryLabel }}
          </UButton>
        </div>
      </div>
    </UCard>
  </component>
</template>

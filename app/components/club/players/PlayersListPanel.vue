<script setup lang="ts">
import type { Player } from '~/types/models'

defineProps<{
  players: Player[]
  loading: boolean
  searchQuery: string
  filterActive: 'all' | 'active' | 'inactive'
  filterGender: 'all' | 'male' | 'female'
  activeFilterItems: { label: string, value: string }[]
  genderFilterItems: { label: string, value: string }[]
  canDeleteAthlete: boolean
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:filterActive': [value: 'all' | 'active' | 'inactive']
  'update:filterGender': [value: 'all' | 'male' | 'female']
  edit: [player: Player]
  delete: [player: Player]
}>()

function genderLabel(g?: string | null) {
  return g === 'female' ? 'Kobieta' : 'Mężczyzna'
}
</script>

<template>
  <div class="space-y-4">
    <PanelDataToolbar :summary="loading ? undefined : `${players.length} zawodników w widoku`">
      <template #filters>
        <UFormField label="Szukaj" class="min-w-0 flex-1 sm:max-w-xs">
          <UInput
            :model-value="searchQuery"
            icon="i-lucide-search"
            placeholder="Nazwisko lub imię…"
            size="lg"
            class="w-full"
            @update:model-value="emit('update:searchQuery', String($event ?? ''))"
          />
        </UFormField>
        <UFormField label="Status" class="w-full sm:w-40">
          <SlaviaOverlaySelect
            :model-value="filterActive"
            :items="activeFilterItems"
            value-key="value"
            size="lg"
            class="w-full"
            @update:model-value="emit('update:filterActive', $event as 'all' | 'active' | 'inactive')"
          />
        </UFormField>
        <UFormField label="Płeć" class="w-full sm:w-40">
          <SlaviaOverlaySelect
            :model-value="filterGender"
            :items="genderFilterItems"
            value-key="value"
            size="lg"
            class="w-full"
            @update:model-value="emit('update:filterGender', $event as 'all' | 'male' | 'female')"
          />
        </UFormField>
      </template>
    </PanelDataToolbar>

    <UCard
      class="overflow-hidden rounded-2xl border-default/70 ring-1 ring-default/20"
      :ui="{ body: 'p-0' }"
    >
      <div class="hidden overflow-x-auto md:block slavia-data-table">
        <table class="w-full min-w-[720px] text-sm">
          <thead>
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-muted">Zawodnik</th>
              <th class="px-4 py-3 text-center font-semibold text-muted">Rok ur.</th>
              <th class="px-4 py-3 text-center font-semibold text-muted">Kat.</th>
              <th class="px-4 py-3 text-center font-semibold tabular-nums text-muted">Rw.</th>
              <th class="px-4 py-3 text-center font-semibold tabular-nums text-muted">Podrzut</th>
              <th class="px-4 py-3 text-center font-semibold tabular-nums text-muted">Suma</th>
              <th class="px-4 py-3 text-center font-semibold text-muted">Aktywny</th>
              <th class="px-4 py-3 text-right font-semibold text-muted">Akcje</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-if="loading">
              <td colspan="8" class="px-4 py-8">
                <div class="flex flex-col gap-3">
                  <SlaviaShimmerText block width="100%" height="0.9rem" />
                  <SlaviaShimmerText block width="92%" height="0.9rem" />
                  <SlaviaShimmerText block width="86%" height="0.9rem" />
                </div>
              </td>
            </tr>
            <tr
              v-for="p in players"
              v-else
              :key="p.id"
              class="hover:bg-muted/20"
            >
              <td class="px-4 py-3 font-medium">
                <div class="flex items-center gap-3">
                  <UAvatar :src="p.image_url ?? undefined" size="xs" />
                  <div>
                    <div class="flex items-center gap-2">
                      <p>{{ p.full_name }}</p>
                      <UTooltip v-if="p.user_id" text="Konto powiązane">
                        <UIcon name="i-lucide-user-check" class="size-3.5 text-primary" />
                      </UTooltip>
                      <UTooltip v-if="p.has_standing_order" text="Przelew stały">
                        <UIcon name="i-lucide-repeat" class="size-3.5 text-success" />
                      </UTooltip>
                    </div>
                    <p class="text-[10px] font-bold uppercase text-muted">{{ genderLabel(p.gender) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-center tabular-nums text-muted">{{ p.birth_year ?? '—' }}</td>
              <td class="px-4 py-3 text-center text-muted">
                {{ p.weight_category ?? '—' }}
                <span v-if="p.bodyweight" class="block text-[10px]">({{ p.bodyweight }} kg)</span>
              </td>
              <td class="px-4 py-3 text-center tabular-nums">{{ p.best_snatch_kg ?? '—' }}</td>
              <td class="px-4 py-3 text-center tabular-nums">{{ p.best_clean_jerk_kg ?? '—' }}</td>
              <td class="px-4 py-3 text-center tabular-nums font-medium">{{ p.total_kg ?? '—' }}</td>
              <td class="px-4 py-3 text-center">
                <UBadge :color="p.is_active !== false ? 'success' : 'neutral'" variant="subtle">
                  {{ p.is_active !== false ? 'Tak' : 'Nie' }}
                </UBadge>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1">
                  <UButton icon="i-lucide-pencil" size="xs" color="neutral" variant="ghost" @click="emit('edit', p)" />
                  <UButton
                    v-if="canDeleteAthlete"
                    icon="i-lucide-trash-2"
                    size="xs"
                    color="error"
                    variant="ghost"
                    @click="emit('delete', p)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-3 p-4 md:hidden">
        <div v-if="loading" class="flex flex-col gap-3">
          <SlaviaShimmerText block width="100%" height="4rem" />
          <SlaviaShimmerText block width="100%" height="4rem" />
        </div>
        <UCard
          v-for="p in players"
          v-else
          :key="p.id"
          class="border-default/60"
        >
          <div class="flex items-start gap-3">
            <UAvatar :src="p.image_url ?? undefined" size="md" />
            <div class="min-w-0 flex-1">
              <p class="font-bold text-highlighted">{{ p.full_name }}</p>
              <p class="text-xs text-muted">{{ genderLabel(p.gender) }} · {{ p.birth_year ?? '—' }}</p>
              <p class="mt-1 text-xs tabular-nums text-muted">
                Suma {{ p.total_kg ?? '—' }} kg
              </p>
            </div>
            <div class="flex gap-1">
              <UButton icon="i-lucide-pencil" size="xs" color="neutral" variant="ghost" @click="emit('edit', p)" />
              <UButton
                v-if="canDeleteAthlete"
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                variant="ghost"
                @click="emit('delete', p)"
              />
            </div>
          </div>
        </UCard>
      </div>

      <SlaviaEmptyState
        v-if="!loading && players.length === 0"
        compact
        icon="i-lucide-users"
        title="Brak wyników"
        description="Zmień filtry lub dodaj nowego zawodnika."
        class="px-4 py-6"
      />
    </UCard>
  </div>
</template>

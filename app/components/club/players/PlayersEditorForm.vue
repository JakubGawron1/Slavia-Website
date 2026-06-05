<script setup lang="ts">
import { usePlayersEditorContext } from './playersEditorContext'

const {
  activeEditorTab,
  form,
  genderSelectItems,
  uploadLoading,
  fileInputRef,
  clickFileInput,
  onFileChange,
  setBirthYear,
  currentYear,
  pzpcAgeSelectItems,
  pzpcWeightSelectItems,
  setOptionalNumber,
  legacyWeightCategoryHint,
  editingId,
  canManageAthleteLogin,
  expReverseLink,
  athleteAccountSelected,
  athleteAccountOptions,
  athleteAccountSaving,
  attachExistingAccountToAthlete,
  detachAccountFromAthlete,
  editingPlayer,
  linkedAthleteAccountUsername,
  competitionsCatalog,
  assignedCompetitionIds,
  assignmentsLoading,
  savePlayer
} = usePlayersEditorContext()
</script>

<template>
  <form
    id="players-editor-form"
    @submit.prevent="savePlayer"
  >
    <div
      v-if="activeEditorTab === 'profile'"
      class="slavia-form-panel slavia-editor-tab-panel"
    >
      <div class="slavia-form-panel__header">
        <div class="slavia-form-panel__title">
          <span class="slavia-form-panel__icon">
            <UIcon name="i-lucide-user" class="size-4" />
          </span>
          Dane podstawowe
        </div>
      </div>
      <div class="slavia-form-panel__body space-y-5">
        <UFormField
          label="Nazwisko i imię"
          required
        >
          <UInput
            v-model="form.full_name"
            autocomplete="name"
            placeholder="np. Kowalski Jan"
            size="lg"
            class="w-full"
            data-form-field="name"
          />
        </UFormField>
        <div class="grid gap-5 md:grid-cols-2">
          <UFormField
            label="Płeć"
            required
          >
            <SlaviaSheetSelect
              v-model="form.gender"
              value-key="value"
              :items="genderSelectItems"
              size="lg"
              class="w-full"
              data-form-field="gender"
            />
          </UFormField>
          <UFormField label="Zdjęcie (URL lub wgrywanie)">
            <div class="flex flex-wrap items-center gap-2">
              <UInput
                v-model="form.image_url"
                placeholder="https://..."
                size="lg"
                class="min-w-0 flex-1"
              />
              <UButton
                type="button"
                icon="i-lucide-upload"
                color="neutral"
                variant="soft"
                size="lg"
                :loading="uploadLoading"
                @click="clickFileInput"
              />
              <input
                ref="fileInputRef"
                type="file"
                hidden
                accept="image/*"
                @change="onFileChange"
              >
            </div>
          </UFormField>
        </div>
      </div>
    </div>

    <div
      v-if="activeEditorTab === 'sport'"
      class="slavia-form-panel slavia-editor-tab-panel"
    >
      <div class="slavia-form-panel__header">
        <div class="slavia-form-panel__title">
          <span class="slavia-form-panel__icon">
            <UIcon name="i-lucide-dumbbell" class="size-4" />
          </span>
          Parametry sportowe
        </div>
        <p class="slavia-form-panel__desc">
          Rok urodzenia jako cztery cyfry — bez przecinka ani spacji.
        </p>
      </div>
      <div class="slavia-form-panel__body space-y-5">
        <div class="slavia-form-grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <UFormField label="Rok urodzenia">
            <UInput
              :model-value="form.birth_year === null || form.birth_year === undefined ? '' : String(form.birth_year)"
              type="number"
              inputmode="numeric"
              size="lg"
              class="w-full tabular-nums"
              :min="1950"
              :max="currentYear"
              placeholder="np. 2010"
              data-form-field="birth_year"
              @update:model-value="setBirthYear"
            />
          </UFormField>
          <UFormField
            label="Grupa wiekowa (PZPC)"
            description="Lista klas wagowych zależy od grupy i płci."
          >
            <SlaviaSheetSelect
              v-model="form.pzpc_age_group"
              value-key="value"
              :items="pzpcAgeSelectItems"
              size="lg"
              class="w-full"
              data-form-field="pzpc_age_group"
            />
          </UFormField>
          <UFormField
            label="Kategoria wagowa (startowa)"
            description="Z aktualnych widełek PZPC dla wybranej grupy."
          >
            <SlaviaSheetSelect
              v-model="form.pzpc_weight_class"
              value-key="value"
              :items="[{ label: '— wybierz —', value: '' }, ...pzpcWeightSelectItems]"
              size="lg"
              class="w-full"
              data-form-field="pzpc_weight_class"
            />
          </UFormField>
          <UFormField
            label="Aktualna masa ciała (kg)"
            description="Rzeczywisty pomiar, nie limit kategorii."
          >
            <UInput
              :model-value="form.bodyweight == null ? '' : String(form.bodyweight)"
              type="number"
              inputmode="decimal"
              :min="0"
              :max="300"
              step="0.1"
              placeholder="np. 72.5"
              size="lg"
              class="w-full tabular-nums"
              data-form-field="bodyweight"
              @update:model-value="(v) => setOptionalNumber('bodyweight', v)"
            />
          </UFormField>
        </div>
        <p
          v-if="legacyWeightCategoryHint"
          class="text-xs leading-snug text-amber-700 dark:text-amber-400"
        >
          {{ legacyWeightCategoryHint }}
        </p>
        <div class="slavia-form-grid grid-cols-1 md:grid-cols-3">
          <UFormField label="Rwanie (kg)">
            <UInput
              :model-value="form.best_snatch_kg == null ? '' : String(form.best_snatch_kg)"
              type="number"
              inputmode="decimal"
              :min="0"
              step="0.5"
              placeholder="—"
              size="lg"
              class="w-full tabular-nums"
              @update:model-value="(v) => setOptionalNumber('best_snatch_kg', v)"
            />
          </UFormField>
          <UFormField label="Podrzut (kg)">
            <UInput
              :model-value="form.best_clean_jerk_kg == null ? '' : String(form.best_clean_jerk_kg)"
              type="number"
              inputmode="decimal"
              :min="0"
              step="0.5"
              placeholder="—"
              size="lg"
              class="w-full tabular-nums"
              @update:model-value="(v) => setOptionalNumber('best_clean_jerk_kg', v)"
            />
          </UFormField>
          <UFormField label="Suma (kg)">
            <UInput
              :model-value="form.total_kg == null ? '' : String(form.total_kg)"
              type="number"
              inputmode="decimal"
              :min="0"
              placeholder="—"
              size="lg"
              class="w-full tabular-nums"
              disabled
            />
          </UFormField>
        </div>
      </div>
    </div>

    <div
      v-if="activeEditorTab === 'account'"
      class="slavia-form-panel slavia-editor-tab-panel"
    >
      <div class="slavia-form-panel__header">
        <div class="slavia-form-panel__title">
          <span class="slavia-form-panel__icon">
            <UIcon name="i-lucide-key-round" class="size-4" />
          </span>
          Konto i dostęp
        </div>
      </div>
      <div class="slavia-form-panel__body space-y-5">
        <div
          v-if="editingId && canManageAthleteLogin && expReverseLink"
          class="rounded-xl border border-default/70 bg-muted/10 p-4 dark:bg-muted/5"
        >
          <p class="text-sm font-bold text-highlighted">
            Powiązane konto zawodnika
          </p>
          <p class="mt-1 text-xs text-muted">
            Wybierz istniejące konto z rolą „Athlete” i przypisz do tego profilu.
          </p>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <UFormField label="Konto (Athlete)">
              <SlaviaSheetSelect
                v-model="athleteAccountSelected"
                :items="athleteAccountOptions"
                value-key="value"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <div class="flex flex-wrap items-end gap-2">
              <UButton
                type="button"
                color="primary"
                size="lg"
                class="rounded-xl font-bold"
                :loading="athleteAccountSaving"
                @click="attachExistingAccountToAthlete"
              >
                Przypisz konto
              </UButton>
              <UButton
                v-if="editingPlayer?.user_id"
                type="button"
                color="neutral"
                variant="outline"
                size="lg"
                class="rounded-xl font-bold"
                :loading="athleteAccountSaving"
                @click="detachAccountFromAthlete"
              >
                Odłącz
              </UButton>
            </div>
          </div>
          <p
            v-if="editingPlayer?.user_id"
            class="mt-3 text-[11px] text-muted"
          >
            Aktualnie przypięte konto: <span class="font-mono">{{ linkedAthleteAccountUsername }}</span>
          </p>
        </div>

        <div v-if="!editingId || !editingPlayer?.user_id">
          <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-default/60 bg-muted/20 px-4 py-3 dark:bg-muted/10">
            <div>
              <p class="text-sm font-bold text-highlighted">
                {{ canManageAthleteLogin ? 'Utwórz konto logowania' : 'Prośba o konto u administratora' }}
              </p>
              <p class="text-xs text-muted">
                <template v-if="canManageAthleteLogin">
                  Zawodnik zaloguje się do panelu i edytuje swój profil.
                </template>
                <template v-else>
                  Jako trener nie tworzysz konta — zaznacz i podaj proponowany login; administrator dostanie powiadomienie.
                </template>
              </p>
            </div>
            <USwitch v-model="form.create_account" />
          </div>
          <div
            v-if="form.create_account"
            class="mt-5 grid gap-5 sm:grid-cols-2"
          >
            <UFormField
              label="Login"
              required
            >
              <UInput
                v-model="form.username"
                placeholder="np. login"
                size="lg"
                class="w-full"
                data-form-field="username"
              />
            </UFormField>
            <UFormField
              v-if="canManageAthleteLogin"
              label="Hasło (opcjonalnie)"
            >
              <UInput
                v-model="form.password"
                type="password"
                placeholder="Domyślnie: Slavia2026"
                size="lg"
                class="w-full"
              />
            </UFormField>
            <UFormField
              v-else
              label="Hasło"
              description="Po akceptacji prośby ustawi je administrator."
            >
              <UInput
                disabled
                placeholder="—"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>
        <div
          v-else
          class="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3"
        >
          <UIcon
            name="i-lucide-user-check"
            class="size-5 shrink-0 text-primary"
          />
          <div>
            <p class="text-sm font-bold text-primary">
              Konto powiązane
            </p>
            <p class="text-xs text-muted">
              Ten zawodnik ma już konto w systemie.
            </p>
          </div>
        </div>

        <div class="rounded-xl border border-default/70 bg-muted/10 p-4 dark:bg-muted/5">
          <p class="text-sm font-bold text-highlighted">
            Przypisania do zawodów
          </p>
          <p class="mt-1 text-xs text-muted">
            Zaznaczone pozycje trafiają do osobistego kalendarza zawodnika.
          </p>
          <div
            v-if="assignmentsLoading"
            class="mt-4 flex items-center gap-2 text-sm text-muted"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-4 shrink-0 animate-spin"
            />
            Wczytywanie…
          </div>
          <div
            v-else-if="!competitionsCatalog.length"
            class="mt-3 text-xs text-muted"
          >
            Brak wpisów w kalendarzu — dodaj wydarzenie w zakładce Kalendarz.
          </div>
          <div
            v-else
            class="mt-4 max-h-52 space-y-2 overflow-y-auto pr-1"
          >
            <label
              v-for="c in competitionsCatalog"
              :key="c.id"
              class="flex cursor-pointer items-start gap-3 rounded-lg border border-default/60 bg-background/80 px-3 py-2.5 transition-colors hover:border-primary/35 hover:bg-primary/5"
            >
              <input
                v-model="assignedCompetitionIds"
                type="checkbox"
                :value="c.id"
                class="mt-1 size-4 rounded border-default text-primary focus:ring-primary/40"
              >
              <span class="text-sm leading-snug">
                <span class="font-semibold text-highlighted">{{ c.title }}</span>
                <span class="block text-xs text-muted tabular-nums">{{ (c.date || '').slice(0, 10) }} · {{ c.location }}</span>
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="activeEditorTab === 'public'"
      class="slavia-form-panel slavia-editor-tab-panel"
    >
      <div class="slavia-form-panel__header">
        <div class="slavia-form-panel__title">
          <span class="slavia-form-panel__icon">
            <UIcon name="i-lucide-globe" class="size-4" />
          </span>
          Profil publiczny
        </div>
        <p class="slavia-form-panel__desc">
          Widoczne na stronie „Zawodnicy” i na publicznym profilu pod adresem /athlete/…
        </p>
      </div>
      <div class="slavia-form-panel__body space-y-5">
        <UFormField
          label="Slogan / krótki podtytuł"
          hint="Np. rola w klubie, kategoria wiekowa."
        >
          <UInput
            v-model="form.profile_tagline"
            placeholder="np. Junior · waga 75 kg"
            size="lg"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Rozbudowany opis (bio)"
          hint="To jest główny tekst na publicznym profilu zawodnika."
        >
          <UTextarea
            v-model="form.public_bio"
            :rows="5"
            autoresize
            placeholder="Osiągnięcia, styl startów, cele…"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <div
      v-if="activeEditorTab === 'status'"
      class="slavia-form-panel slavia-editor-tab-panel"
    >
      <div class="slavia-form-panel__header">
        <div class="slavia-form-panel__title">
          <span class="slavia-form-panel__icon">
            <UIcon name="i-lucide-sliders-horizontal" class="size-4" />
          </span>
          Notatki i status
        </div>
      </div>
      <div class="slavia-form-panel__body space-y-5">
        <UFormField label="Notatki wewnętrzne">
          <UTextarea
            v-model="form.notes"
            :rows="4"
            autoresize
            placeholder="Tylko dla kadry — nie pokazujemy na publicznym profilu."
            class="w-full"
          />
        </UFormField>
        <div class="space-y-3 border-t border-default/50 pt-5">
          <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-default/60 bg-muted/20 px-4 py-3 dark:bg-muted/10">
            <div>
              <p class="text-sm font-bold text-highlighted">
                Aktywny w kadrze
              </p>
              <p class="text-xs text-muted">
                Widoczny na liście aktywnych zawodników.
              </p>
            </div>
            <USwitch v-model="form.is_active" />
          </div>
          <div class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-default/60 bg-muted/20 px-4 py-3 dark:bg-muted/10">
            <div>
              <p class="flex items-center gap-1.5 text-sm font-bold text-highlighted">
                <UIcon name="i-lucide-repeat" class="size-3.5 text-success" />
                Przelew stały (auto-składka)
              </p>
              <p class="text-xs text-muted">
                Co miesiąc system sam zaznacza składkę jako opłaconą.
              </p>
            </div>
            <USwitch v-model="form.has_standing_order" />
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

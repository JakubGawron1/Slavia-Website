import type { PaymentMonthStatusRow } from '~/types/models'
import { membershipYearStats } from '~/utils/paymentSemantics'

/** Wspólna siatka roku składek (zawodnik + trener). */
export function useMembershipYearGrid(
  fetchRows: (year: number) => Promise<PaymentMonthStatusRow[]>
) {
  const currentYear = new Date().getFullYear()
  const calendarMonth = new Date().getMonth() + 1
  const canPreviewNextYear = computed(() => calendarMonth >= 11)
  const allowedYears = computed(() =>
    canPreviewNextYear.value ? [currentYear, currentYear + 1] : [currentYear]
  )
  const year = ref<number>(currentYear)
  const loadingYear = ref(false)
  const yearRows = ref<PaymentMonthStatusRow[]>([])

  const yearStats = computed(() => membershipYearStats(yearRows.value))

  async function refreshYearTable() {
    if (!allowedYears.value.includes(year.value)) {
      year.value = allowedYears.value[0]!
    }
    loadingYear.value = true
    try {
      const rows = await fetchRows(year.value)
      yearRows.value = Array.isArray(rows) ? rows : []
    } catch {
      yearRows.value = []
    } finally {
      loadingYear.value = false
    }
  }

  watch(year, () => {
    void refreshYearTable()
  })

  return {
    year,
    allowedYears,
    yearRows,
    loadingYear,
    yearStats,
    refreshYearTable
  }
}

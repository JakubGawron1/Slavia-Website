import { apiRoutes } from '~/config/api'
import type { Player } from '~/types/models'

export function usePlayersManagerList() {
  const api = useApi()
  const toast = useToast()

  const players = ref<Player[]>([])
  const loading = ref(true)
  const searchQuery = ref('')
  const filterActive = ref<'all' | 'active' | 'inactive'>('all')
  const filterGender = ref<'all' | 'male' | 'female'>('all')

  async function loadPlayers() {
    loading.value = true
    try {
      players.value = await api<Player[]>(apiRoutes.athletes.listAdmin)
    } catch (e) {
      toast.add({
        title: 'Nie udało się wczytać zawodników',
        description: getApiErrorMessage(e),
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  const playersFiltered = computed(() => {
    let list = players.value
    const q = searchQuery.value.trim().toLowerCase()
    if (q) {
      list = list.filter(p => p.full_name.toLowerCase().includes(q))
    }
    if (filterActive.value === 'active') {
      list = list.filter(p => p.is_active !== false)
    } else if (filterActive.value === 'inactive') {
      list = list.filter(p => p.is_active === false)
    }
    if (filterGender.value !== 'all') {
      list = list.filter(p => (p.gender ?? 'male') === filterGender.value)
    }
    return list
  })

  const activeFilterItems = [
    { label: 'Wszyscy', value: 'all' },
    { label: 'Aktywni', value: 'active' },
    { label: 'Nieaktywni', value: 'inactive' }
  ]

  const genderFilterItems = [
    { label: 'Wszyscy', value: 'all' },
    { label: 'Mężczyźni', value: 'male' },
    { label: 'Kobiety', value: 'female' }
  ]

  return {
    players,
    loading,
    searchQuery,
    filterActive,
    filterGender,
    playersFiltered,
    activeFilterItems,
    genderFilterItems,
    loadPlayers
  }
}

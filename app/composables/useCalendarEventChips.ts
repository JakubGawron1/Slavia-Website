/**
 * Wspólna kolorystyka i ikony „chipek” w kalendarzu klubu i kalendarzu osobistym zawodnika.
 *
 * Importy zewnętrzne (PZPC / PC.pl) mają kategorię z bazy (`championship` / `league` / `club_event`)
 * — nie nadpisujemy ich jednym kolorem „indigo”; nierozpoznane zawody z importu dostają różnorodną paletę.
 */
export type CalendarChipEvent = {
  id?: string | null
  title?: string | null
  type?: string
  category?: string | null
  status?: string | null
  external_source?: string | null
}

const EXTERNAL_MISC_CHIP = [
  'bg-cyan-500/12 border-cyan-400/40 text-cyan-300 font-semibold',
  'bg-violet-500/12 border-violet-400/40 text-violet-300 font-semibold',
  'bg-fuchsia-500/12 border-fuchsia-400/38 text-fuchsia-300 font-semibold',
  'bg-sky-500/12 border-sky-400/40 text-sky-300 font-semibold',
  'bg-orange-500/12 border-orange-400/40 text-orange-300 font-semibold',
  'bg-rose-500/12 border-rose-400/40 text-rose-300 font-semibold'
] as const

const EXTERNAL_MISC_MODAL = [
  'bg-linear-to-br from-cyan-600 via-sky-800 to-slate-950 text-white ring-2 ring-cyan-400/40 shadow-[0_20px_50px_-15px_rgba(6,182,212,0.45)]',
  'bg-linear-to-br from-violet-600 via-purple-900 to-slate-950 text-white ring-2 ring-violet-400/40 shadow-[0_20px_50px_-15px_rgba(139,92,246,0.45)]',
  'bg-linear-to-br from-fuchsia-600 via-pink-900 to-slate-950 text-white ring-2 ring-fuchsia-400/40 shadow-[0_20px_50px_-15px_rgba(217,70,239,0.45)]',
  'bg-linear-to-br from-sky-600 via-blue-900 to-slate-950 text-white ring-2 ring-sky-400/40 shadow-[0_20px_50px_-15px_rgba(14,165,233,0.45)]',
  'bg-linear-to-br from-orange-600 via-amber-900 to-slate-950 text-white ring-2 ring-orange-400/40 shadow-[0_20px_50px_-15px_rgba(234,88,12,0.45)]',
  'bg-linear-to-br from-rose-600 via-rose-900 to-slate-950 text-white ring-2 ring-rose-400/40 shadow-[0_20px_50px_-15px_rgba(244,63,94,0.45)]'
] as const

function miscPaletteIndex(event: CalendarChipEvent): number {
  const seed = `${event.id ?? ''}|${event.title ?? ''}|${event.external_source ?? ''}`
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  }
  return Math.abs(h) % EXTERNAL_MISC_CHIP.length
}

function isExternalMisc(event: CalendarChipEvent): boolean {
  if (!event.external_source) return false
  const cat = event.category || 'club_event'
  return cat !== 'championship' && cat !== 'league' && cat !== 'training'
}

export function useCalendarEventChips() {
  function getEventClasses(event: CalendarChipEvent) {
    if (event.status === 'cancelled')
      return 'bg-gray-500/10 border-gray-500/40 text-gray-400 line-through'
    if (event.status === 'moved')
      return 'bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold'
    if (event.type === 'training' || event.category === 'training')
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400'

    const cat = event.category || 'club_event'
    if (cat === 'championship') {
      const ext = event.external_source
        ? ' ring-1 ring-indigo-400/25'
        : ''
      return `bg-red-500/15 border-red-500/40 text-red-400 font-bold${ext}`
    }
    if (cat === 'league') {
      const ext = event.external_source
        ? ' ring-1 ring-indigo-400/25'
        : ''
      return `bg-amber-500/15 border-amber-500/40 text-amber-400 font-bold${ext}`
    }

    if (isExternalMisc(event)) {
      return EXTERNAL_MISC_CHIP[miscPaletteIndex(event)]
    }

    return 'bg-teal-500/15 border-teal-500/40 text-teal-400 font-bold'
  }

  function getEventIcon(event: CalendarChipEvent) {
    if (event.type === 'training') return 'i-lucide-dumbbell'
    const cat = event.category || 'club_event'
    if (cat === 'championship') return 'i-lucide-trophy'
    if (cat === 'league') return 'i-lucide-medal'
    if (event.external_source) return 'i-lucide-globe'
    return 'i-lucide-star'
  }

  /** Nagłówek modala — gradient + pierścień (Tailwind). */
  function getEventModalHeaderClass(event: CalendarChipEvent) {
    if (event.status === 'cancelled') {
      return 'bg-linear-to-br from-zinc-600 via-zinc-800 to-neutral-950 text-white ring-2 ring-zinc-500/40 opacity-95'
    }
    if (event.status === 'moved') {
      return 'bg-linear-to-br from-amber-500 via-orange-700 to-neutral-950 text-white ring-2 ring-amber-400/45 shadow-[0_20px_50px_-15px_rgba(245,158,11,0.45)]'
    }
    if (event.type === 'training' || event.category === 'training') {
      return 'bg-linear-to-br from-blue-600 via-blue-700 to-slate-950 text-white ring-2 ring-blue-400/40 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.55)]'
    }

    const cat = event.category || 'club_event'
    if (cat === 'championship') {
      return event.external_source
        ? 'bg-linear-to-br from-red-600 via-rose-800 to-slate-950 text-white ring-2 ring-indigo-400/45 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.45)]'
        : 'bg-linear-to-br from-red-600 via-rose-800 to-neutral-950 text-white ring-2 ring-red-400/40 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.45)]'
    }
    if (cat === 'league') {
      return event.external_source
        ? 'bg-linear-to-br from-amber-500 via-amber-700 to-slate-950 text-white ring-2 ring-indigo-400/40 shadow-[0_20px_50px_-15px_rgba(245,158,11,0.4)]'
        : 'bg-linear-to-br from-amber-500 via-amber-700 to-neutral-950 text-white ring-2 ring-amber-300/40 shadow-[0_20px_50px_-15px_rgba(245,158,11,0.4)]'
    }

    if (isExternalMisc(event)) {
      return EXTERNAL_MISC_MODAL[miscPaletteIndex(event)]
    }

    return 'bg-linear-to-br from-teal-600 via-emerald-800 to-slate-950 text-white ring-2 ring-teal-400/35 shadow-[0_20px_50px_-15px_rgba(20,184,166,0.45)]'
  }

  function getEventKindLabel(event: CalendarChipEvent) {
    if (event.type === 'training' || event.category === 'training') return 'Trening klubowy'
    const ext = !!event.external_source
    const cat = event.category || 'club_event'
    if (cat === 'championship')
      return ext ? 'Mistrzostwa (import zewnętrzny)' : 'Mistrzostwa / zawody ogólne'
    if (cat === 'league')
      return ext ? 'Liga (import zewnętrzny)' : 'Liga'
    if (ext) return 'Zawody / wydarzenie (import zewnętrzny)'
    return 'Wydarzenie klubowe'
  }

  return { getEventClasses, getEventIcon, getEventModalHeaderClass, getEventKindLabel }
}

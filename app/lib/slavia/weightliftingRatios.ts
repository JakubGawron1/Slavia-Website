export type RatioRange = {
  /** min = dolna granica (np. 0.8), max = górna (np. 0.85) */
  min: number
  max: number
  /** Źródło / uzasadnienie (krótko) */
  source: string
  /** Jeśli true, zakres jest bardziej „heurystyczny” (brak twardego źródła). */
  heuristic?: boolean
}

export type ExerciseId =
  | 'snatch'
  | 'clean_jerk'
  | 'power_snatch'
  | 'power_clean'
  | 'power_jerk'
  | 'back_squat'
  | 'front_squat'
  | 'snatch_squat' // przysiad rwaniowy (overhead squat)
  | 'snatch_pull'
  | 'clean_pull'
  | 'deadlift'
  | 'strict_press'
  | 'push_press'
  | 'snatch_push_press'
  | 'split_jerk_front'
  | 'split_jerk_back'
  | 'snatch_press'
  | 'clean_from_blocks'
  | 'snatch_from_blocks'
  | 'power_snatch_balance' // wybijanie / balans do rwania (snatch balance)

export type ExerciseDef = {
  id: ExerciseId
  pl: string
  en?: string
  /** Od jakiego „bazowego” ćwiczenia liczymy sugerowany zakres. */
  from: ExerciseId
  ratio: RatioRange
  /** Miłe, konkretne wskazówki gdy jesteś poniżej widełek (opcjonalnie). */
  adviceBelow?: string
  /** Miłe, konkretne wskazówki gdy jesteś powyżej widełek (opcjonalnie). */
  adviceAbove?: string
}

type RatioEdge = {
  to: ExerciseId
  from: ExerciseId
  ratio: RatioRange
  adviceBelow?: string
  adviceAbove?: string
}

/**
 * „Złote proporcje” / ratio ranges — praktyczne benchmarki do planowania.
 *
 * Uwaga: to są widełki (nie jedna liczba). Różnice antropometryczne i techniczne potrafią
 * zmieniać wynik o kilka–kilkanaście procent.
 */
export const EXERCISES: ExerciseDef[] = [
  { id: 'snatch', pl: 'Rwanie', en: 'Snatch', from: 'snatch', ratio: { min: 1, max: 1, source: 'Wartość bazowa' } },
  { id: 'clean_jerk', pl: 'Podrzut', en: 'Clean & Jerk', from: 'clean_jerk', ratio: { min: 1, max: 1, source: 'Wartość bazowa' } },

  // Siady
  {
    id: 'back_squat',
    pl: 'Przysiad z tyłu',
    en: 'Back Squat',
    from: 'clean_jerk',
    ratio: { min: 1 / 0.85, max: 1 / 0.75, source: 'C&J ≈ 75–85% back squat (benchmarki ratio)', heuristic: false },
    adviceBelow: 'Jeśli przysiad z tyłu odstaje, często najszybciej działa plan siłowy (progresja 3–6 tygodni) + spokojna objętość na nogi i grzbiet. Technika w C&J zwykle rośnie „sama”, gdy masz mocny fundament.',
    adviceAbove: 'Jeśli przysiad jest bardzo mocny, a podrzut stoi, to dobry znak — masz siłę. Najczęściej brakuje transferu: praca nad techniką (szczególnie clean i jerk), szybkość pod sztangę i stabilizacja nad głową.'
  },
  {
    id: 'front_squat',
    pl: 'Przysiad z przodu',
    en: 'Front Squat',
    from: 'back_squat',
    ratio: { min: 0.85, max: 0.93, source: 'Front squat ≈ 85–93% back squat (ratio)', heuristic: false },
    adviceBelow: 'Gdy przysiad z przodu jest niski względem tyłu, zwykle pomaga praca nad pozycją rack (mobilność + stabilizacja) i siłą czwórek. Dodaj pauzy na dole i spokojne serie 3–5.',
    adviceAbove: 'Jeśli front squat jest bardzo blisko back squatu, to świetny „clean engine”. Żeby przełożyć to na wynik, skup się na dynamice wejścia pod sztangę i jakości pozycji wstania z ciężkiego zarzutu.'
  },
  {
    id: 'snatch_squat',
    pl: 'Przysiad rwaniowy',
    en: 'Overhead Squat',
    from: 'snatch',
    ratio: { min: 0.95, max: 1.05, source: 'Overhead squat ~ 100% snatch (gold standards)', heuristic: false },
    adviceBelow: 'Jeśli przysiad rwaniowy odstaje, to najczęściej kwestia mobilności/stabilizacji nad głową. Dobrze działają OHS w tempie, pauzy w dole i praca nad „zamkniętym” barkiem (rotatory + łopatka).',
    adviceAbove: 'Mocny OHS to super baza. Jeśli rwanie nie nadąża, zwykle warto dołożyć technikę: timing podbicia, stabilne przyjęcie i szybkość zejścia pod sztangę.'
  },
  {
    id: 'power_snatch_balance',
    pl: 'Wybijanie do rwania',
    en: 'Snatch Balance',
    from: 'snatch',
    ratio: { min: 1.00, max: 1.10, source: 'Snatch balance ~ 105% snatch (gold standards) + widełki', heuristic: false },
    adviceBelow: 'Jeśli snatch balance jest niski, zwykle brakuje pewności w przyjęciu i stabilizacji. Pomaga praca nad „lockoutem”, drop snatch i serie z pauzą w dole (kontrola).',
    adviceAbove: 'Jeśli snatch balance jest wyraźnie mocniejszy, masz świetną stabilizację. Żeby przenieść to na rwanie, skup się na jakości ciągu i tym, żeby „wjeżdżać pod sztangę”, a nie ciągnąć jej w górę.'
  },

  // Power / siłowe
  {
    id: 'power_snatch',
    pl: 'Rwanie siłowe',
    en: 'Power Snatch',
    from: 'snatch',
    ratio: { min: 0.80, max: 0.85, source: 'Praktyczne widełki: power snatch ≈ 80–85% snatch', heuristic: false },
    adviceBelow: 'Jeśli rwanie siłowe jest nisko, często brakuje „mocy” w drugiej fazie (biodra) albo odwagi w szybkim dociągnięciu łokci. Dobrze działają high pulls, hang power snatch i praca nad tempem.',
    adviceAbove: 'Jeśli power snatch jest bardzo blisko pełnego rwania, to zwykle znak, że warto popracować nad zejściem pod sztangę (szybkość i pewność przyjęcia) — wtedy pełne rwanie dogoni power.'
  },
  {
    id: 'power_clean',
    pl: 'Zarzut siłowy',
    en: 'Power Clean',
    from: 'clean_jerk',
    ratio: { min: 0.85, max: 0.90, source: 'Power clean ≈ 88% C&J (gold standards) + widełki', heuristic: false },
    adviceBelow: 'Niski power clean zwykle oznacza brak dynamiki w wybiciu albo słabszą pozycję startową. Pomaga praca z bloków/hangu i szybkie serie na jakości (bez „ciągnięcia plecami”).',
    adviceAbove: 'Jeśli power clean jest mocny, a C&J stoi, często ogranicza Cię jerk albo wstawanie z pełnego zarzutu (front squat / pozycja rack).'
  },
  {
    id: 'power_jerk',
    pl: 'Wybijanie siłowe (power jerk)',
    en: 'Power Jerk',
    from: 'clean_jerk',
    ratio: { min: 0.90, max: 1.05, source: 'Zależne od tego czy limituje clean czy jerk — widełki praktyczne', heuristic: true },
    adviceBelow: 'Jeśli power jerk odstaje, często pomaga praca nad dip&drive (pionowy tor) i stabilizacją nad głową: push press, jerk balances, krótkie serie techniczne.',
    adviceAbove: 'Jeśli power jerk jest mocny, a C&J stoi, to świetnie — zostaje dopiąć clean (wejście pod sztangę) lub przejście z clean do jerk (ustawienie stóp/oddech).'
  },

  // Ciągi
  {
    id: 'snatch_pull',
    pl: 'Ciągi do rwania',
    en: 'Snatch Pull',
    from: 'snatch',
    ratio: { min: 0.90, max: 1.15, source: 'Typowe widełki treningowe dla pulls', heuristic: true },
    adviceBelow: 'Jeśli ciągi do rwania są nisko, dołóż spokojnie siłę w pierwszym ciągu: tempo pulls, zatrzymania pod kolanem i kontrola pozycji pleców.',
    adviceAbove: 'Jeśli ciągi są bardzo mocne, a rwanie stoi, to sygnał że „siła jest” — priorytetem staje się technika (kontakt z udem, timing, zejście pod sztangę).'
  },
  {
    id: 'clean_pull',
    pl: 'Ciągi do podrzutu',
    en: 'Clean Pull',
    from: 'clean_jerk',
    ratio: { min: 1.00, max: 1.25, source: 'Typowe widełki treningowe dla clean pulls', heuristic: true },
    adviceBelow: 'Jeśli clean pulls odstają, zwykle pomaga praca nad pozycją pleców i nogami: tempo, pauzy, utrzymanie barków nad sztangą.',
    adviceAbove: 'Jeśli clean pulls są bardzo mocne, a podrzut stoi, to często ogranicza clean w przyjęciu (rack, szybkość wejścia) albo jerk.'
  },
  {
    id: 'deadlift',
    pl: 'Martwy ciąg',
    en: 'Deadlift',
    from: 'back_squat',
    ratio: { min: 1.00, max: 1.20, source: 'Back squat : deadlift ~ 80% (czyli deadlift ~ 1.25× BS) — antropometria mocno wpływa', heuristic: true }
  },

  // Press / jerk warianty
  {
    id: 'push_press',
    pl: 'Wycisko-podrzut',
    en: 'Push Press',
    from: 'clean_jerk',
    ratio: { min: 0.60, max: 0.75, source: 'Push press ≈ 75–85% jerk; jerk zwykle ≳ C&J (widełki)', heuristic: true }
  },
  {
    id: 'strict_press',
    pl: 'Wyciskanie żołnierskie',
    en: 'Strict Press',
    from: 'push_press',
    ratio: { min: 0.70, max: 0.75, source: 'Strict press ≈ 70–75% push press (ratio)', heuristic: false },
    adviceBelow: 'Jeśli strict press jest nisko względem push press, warto dołożyć trochę czystej siły barków i tricepsa (serie 5–8, kontrola, brak odbicia). To później stabilizuje też jerk.',
    adviceAbove: 'Jeśli strict press jest bardzo wysoki, masz świetną siłę góry. Jeśli jerk nie nadąża, zwykle brakuje pracy nóg i timing’u dip&drive.'
  },
  {
    id: 'snatch_push_press',
    pl: 'Wycisko-wybijanie rwaniowe (chwyt rwaniowy)',
    en: 'Snatch Push Press',
    from: 'push_press',
    ratio: { min: 0.85, max: 1.05, source: 'Snatch-grip zwykle trochę słabszy od klasycznego push press (widełki)', heuristic: true }
  },
  {
    id: 'split_jerk_front',
    pl: 'Wybijanie w nożyce z przodu',
    en: 'Split Jerk (front rack)',
    from: 'clean_jerk',
    ratio: { min: 0.95, max: 1.10, source: 'Zależne od limitu clean vs jerk — widełki praktyczne', heuristic: true }
  },
  {
    id: 'split_jerk_back',
    pl: 'Wybijanie w nożyce z tyłu (sztanga leży na barkach)',
    en: 'Behind-the-neck Split Jerk',
    from: 'split_jerk_front',
    ratio: { min: 0.95, max: 1.05, source: 'BTN bywa podobne lub minimalnie mocniejsze (widełki)', heuristic: true }
  },
  {
    id: 'snatch_press',
    pl: 'Wyciskanie rwaniowe',
    en: 'Snatch Press',
    from: 'snatch',
    ratio: { min: 0.40, max: 0.55, source: 'Silnie zależne od mobilności/stabilizacji; orientacyjne widełki', heuristic: true }
  },

  // Bloki
  {
    id: 'clean_from_blocks',
    pl: 'Zarzut z bloków',
    en: 'Clean from Blocks',
    from: 'clean_jerk',
    ratio: { min: 0.90, max: 1.05, source: 'Bloki pozwalają czasem „dobić” technicznie; widełki praktyczne', heuristic: true }
  },
  {
    id: 'snatch_from_blocks',
    pl: 'Rwanie z bloków',
    en: 'Snatch from Blocks',
    from: 'snatch',
    ratio: { min: 0.90, max: 1.05, source: 'Bloki: zwykle 90–105% pełnego rwania (widełki)', heuristic: true }
  }
]

export type RatioResult = {
  id: ExerciseId
  pl: string
  from: ExerciseId
  fromPl: string
  minKg: number | null
  maxKg: number | null
  ratio: RatioRange
  actualKg: number | null
  actualPct: number | null
  status: 'unknown' | 'in_range' | 'below' | 'above'
  note: string | null
}

function clampPct(p: number) {
  return Math.max(0, Math.min(999, p))
}

function invertRatio(r: RatioRange): RatioRange | null {
  // Odwrócenie relacji: jeśli X = [min..max] * Y, to Y = [1/max .. 1/min] * X
  if (!Number.isFinite(r.min) || !Number.isFinite(r.max) || r.min <= 0 || r.max <= 0) return null
  const min = 1 / r.max
  const max = 1 / r.min
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    source: `Odwrócone: ${r.source}`,
    heuristic: r.heuristic
  }
}

function buildFriendlyNote(args: {
  status: 'in_range' | 'below' | 'above'
  exercisePl: string
  basePl: string
  actualPct: number
  minPct: number
  maxPct: number
  adviceBelow?: string
  adviceAbove?: string
}) {
  const { status, exercisePl, basePl, actualPct, minPct, maxPct, adviceBelow, adviceAbove } = args
  const band = `${Math.round(minPct)}–${Math.round(maxPct)}%`
  const yours = `${Math.round(actualPct)}%`

  if (status === 'in_range') {
    return `Super — ${exercisePl} jest w typowych widełkach względem „${basePl}” (${yours} vs ${band}). Trzymaj ten balans i buduj spokojnie oba elementy.`
  }
  if (status === 'below') {
    return `Spokojnie — ${exercisePl} jest trochę poniżej typowego zakresu względem „${basePl}” (${yours} vs ${band}). ${adviceBelow || 'Najczęściej pomaga konsekwentna praca nad słabym ogniwem: albo technika i timing, albo stabilizacja/mobilność w pozycjach.'}`
  }
  return `To mocna strona — ${exercisePl} wypada powyżej typowego zakresu względem „${basePl}” (${yours} vs ${band}). ${adviceAbove || 'To świetnie, ale jeśli wynik w „${basePl}” stoi w miejscu, warto dołożyć trochę pracy nad transferem (technika, szybkość zejścia, stabilizacja).'}`
}

export function computeRatios(inputs: Partial<Record<ExerciseId, number>>): RatioResult[] {
  const nameById = new Map(EXERCISES.map(e => [e.id, e.pl] as const))

  const forwardEdges: RatioEdge[] = EXERCISES.map(e => ({
    to: e.id,
    from: e.from,
    ratio: e.ratio,
    adviceBelow: e.adviceBelow,
    adviceAbove: e.adviceAbove
  }))

  const reverseEdges: RatioEdge[] = forwardEdges
    .map((e) => {
      if (e.to === e.from) return null
      const inv = invertRatio(e.ratio)
      if (!inv) return null
      // Wersja odwrócona ma sens obliczeniowy i daje feedback, ale wskazówki (advice)
      // są pisane pod „kierunek” oryginalny — więc w odwróceniu zostawiamy tylko ogólny opis.
      return { to: e.from, from: e.to, ratio: inv } satisfies RatioEdge
    })
    .filter((x): x is RatioEdge => !!x)

  // Dedup: gdyby kiedyś pojawiły się duplikaty w definicjach.
  const edges = [...forwardEdges, ...reverseEdges].filter((e, idx, arr) => {
    return arr.findIndex(x => x.to === e.to && x.from === e.from) === idx
  })

  return edges
    // Bez self-loopów: porównanie ćwiczenia z samym sobą zawsze daje 100% i nic nie wnosi.
    // Definicje `snatch → snatch` / `clean_jerk → clean_jerk` w `EXERCISES` istnieją
    // wyłącznie po to, żeby zachować je w katalogu (nazwy, pola wejściowe), ale do
    // wyników kalkulatora ich nie liczymy.
    .filter(e => e.to !== e.from)
    .map((e) => {
      const baseRaw = inputs[e.from]
      const base = typeof baseRaw === 'number' ? baseRaw : null
      const minKg = typeof base === 'number' ? base * e.ratio.min : null
      const maxKg = typeof base === 'number' ? base * e.ratio.max : null
      const actualRaw = inputs[e.to]
      const actual = typeof actualRaw === 'number' ? actualRaw : null
      const actualPct = (typeof base === 'number' && typeof actual === 'number' && base > 0)
        ? clampPct((actual / base) * 100)
        : null
      const minPct = e.ratio.min * 100
      const maxPct = e.ratio.max * 100
      let status: RatioResult['status'] = 'unknown'
      let note: string | null = null
      if (actualPct != null) {
        if (actualPct < minPct) status = 'below'
        else if (actualPct > maxPct) status = 'above'
        else status = 'in_range'
        note = buildFriendlyNote({
          status,
          exercisePl: nameById.get(e.to) || e.to,
          basePl: nameById.get(e.from) || e.from,
          actualPct,
          minPct,
          maxPct,
          adviceBelow: e.adviceBelow,
          adviceAbove: e.adviceAbove
        })
      }
      return {
        id: e.to,
        pl: nameById.get(e.to) || e.to,
        from: e.from,
        fromPl: nameById.get(e.from) || e.from,
        minKg: minKg != null ? Number(minKg.toFixed(1)) : null,
        maxKg: maxKg != null ? Number(maxKg.toFixed(1)) : null,
        ratio: e.ratio,
        actualKg: typeof actual === 'number' ? actual : null,
        actualPct: actualPct != null ? Number(actualPct.toFixed(1)) : null,
        status,
        note
      }
    })
}


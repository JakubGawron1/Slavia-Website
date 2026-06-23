import type { BoardDocumentTypeDefinition } from '~/types/boardDocuments'

export type BoardDocumentSkeleton = {
  content: string
  mimeType: string
  /** Pola do uzupełnienia — widoczne w podglądzie PDF-szkieletu. */
  fields?: string[]
}

function csvSkeleton(title: string, headers: string[], sampleRow?: string[]): BoardDocumentSkeleton {
  const row = sampleRow ?? headers.map((h, i) => (i === 0 ? `[SZKIC] ${title}` : '…'))
  return {
    mimeType: 'text/csv',
    content: `\uFEFF${headers.join(';')}\n${row.map(c => `"${c}"`).join(';')}`
  }
}

function htmlSkeleton(title: string, sections: string[]): BoardDocumentSkeleton {
  const body = sections.map(s => `<section><h2>${s}</h2><p><em>Do uzupełnienia…</em></p></section>`).join('\n')
  return {
    mimeType: 'text/html',
    content: `<article class="board-doc-skeleton">
<header>
  <p class="text-muted">Szkielet dokumentu — CKS Slavia</p>
  <h1>${title}</h1>
  <p><strong>Data:</strong> __________ &nbsp; <strong>Autor:</strong> __________</p>
</header>
${body}
<footer><p><small>Wygenerowano jako szablon w panelu dokumentów zarządu.</small></p></footer>
</article>`
  }
}

function pdfSkeleton(title: string, fields: string[]): BoardDocumentSkeleton {
  return {
    mimeType: 'application/pdf',
    content: '',
    fields: ['Tytuł dokumentu', 'Klub', 'Data', ...fields, 'Podpis / pieczęć']
  }
}

const SKELETON_OVERRIDES: Partial<Record<string, BoardDocumentSkeleton>> = {
  admin_board_meeting_protocol: csvSkeleton('Protokół zebrania', [
    'Zawodnik / osoba',
    'Status obecności',
    'Data sesji',
    'Uwagi'
  ]),
  competition_start_list: csvSkeleton('Lista startowa', [
    'Lp.',
    'Zawodnik',
    'Kategoria wagowa',
    'Waga (kg)',
    'Klub'
  ], ['1', 'Nazwisko Imię', '81 kg', '79.0', 'CKS Slavia']),
  meeting_agenda: htmlSkeleton('Porządek obrad', [
    'Otwarcie posiedzenia',
    'Sprawozdanie',
    'Głosowania',
    'Sprawy różne',
    'Zakończenie'
  ]),
  meeting_resolution: htmlSkeleton('Uchwała zarządu', [
    'Podstawa prawna',
    'Treść uchwały',
    'Termin realizacji',
    'Podpisy'
  ]),
  org_statute: htmlSkeleton('Statut klubu', [
    'Postanowienia ogólne',
    'Cele i zadania',
    'Organy klubu',
    'Członkostwo',
    'Postanowienia końcowe'
  ]),
  fin_membership_fees: csvSkeleton('Rejestr składek', [
    'Zawodnik',
    'Miesiąc',
    'Kwota',
    'Status',
    'Data wpłaty'
  ]),
  athlete_emergency_contact: csvSkeleton('Kontakt alarmowy', [
    'Zawodnik',
    'Opiekun',
    'Telefon',
    'E-mail',
    'Uwagi medyczne'
  ])
}

/** Szkielet dokumentu dla danego typu — używany gdy brak pliku w repozytorium. */
export function buildBoardDocumentSkeleton(
  type: Pick<BoardDocumentTypeDefinition, 'id' | 'label' | 'defaultExtension' | 'category'>
): BoardDocumentSkeleton {
  const override = SKELETON_OVERRIDES[type.id]
  if (override) return override

  const label = type.label

  switch (type.defaultExtension) {
    case 'csv':
      return csvSkeleton(label, ['Pole 1', 'Pole 2', 'Pole 3', 'Uwagi'])
    case 'html':
      return htmlSkeleton(label, ['Wprowadzenie', 'Treść', 'Podsumowanie', 'Załączniki'])
    case 'pdf':
      return pdfSkeleton(label, [
        'Strona 1 — dane podstawowe',
        'Strona 2 — szczegóły',
        'Podpis zawodnika / członka zarządu'
      ])
    default:
      return {
        mimeType: 'text/plain',
        content: `${label}\n${'='.repeat(Math.min(label.length, 40))}\n\n[Szkielet dokumentu]\n\n1. …\n2. …\n3. …\n\nData: __________\nPodpis: __________`
      }
  }
}

export function mimeFromExtension(ext: BoardDocumentTypeDefinition['defaultExtension']): string {
  switch (ext) {
    case 'csv':
      return 'text/csv'
    case 'html':
      return 'text/html'
    case 'pdf':
      return 'application/pdf'
    default:
      return 'text/plain'
  }
}

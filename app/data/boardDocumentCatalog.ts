import type { BoardDocumentCategoryId, BoardDocumentTypeDefinition } from '~/types/boardDocuments'

export const BOARD_DOCUMENT_CATEGORY_LABELS: Record<BoardDocumentCategoryId, string> = {
  sports_athlete: 'Zawodnicy',
  sports_coach: 'Trenerzy',
  sports_competition: 'Zawody',
  sports_equipment: 'Sprzęt',
  admin_organizational: 'Organizacyjne',
  admin_financial: 'Finansowe',
  admin_hr: 'Kadry i BHP',
  admin_legal: 'Prawne i RODO',
  admin_marketing: 'Marketing',
  custom: 'Własne'
}

function typeDef(
  id: string,
  label: string,
  category: BoardDocumentCategoryId,
  folder: string,
  defaultExtension: BoardDocumentTypeDefinition['defaultExtension'],
  opts?: Partial<Pick<BoardDocumentTypeDefinition, 'description' | 'generatorKind'>>
): BoardDocumentTypeDefinition {
  const domain = category.startsWith('sports_') ? 'sports' : 'administration'
  return {
    id,
    label,
    domain,
    category,
    folder,
    defaultExtension,
    builtin: true,
    generatorKind: null,
    ...opts
  }
}

/** Wbudowany katalog typów dokumentów zarządu (~55 pozycji). */
export const BUILTIN_BOARD_DOCUMENT_TYPES: BoardDocumentTypeDefinition[] = [
  // —— Zawodnicy (8) ——
  typeDef('athlete_medical_clearance', 'Zaświadczenie lekarskie', 'sports_athlete', 'athletes', 'pdf', {
    description: 'Aktualne badania lekarskie zawodnika.'
  }),
  typeDef('athlete_license_pzpc', 'Licencja PZPC', 'sports_athlete', 'athletes', 'pdf', {
    description: 'Licencja związkowa na sezon.'
  }),
  typeDef('athlete_consent_minor', 'Zgoda rodzica (nieletni)', 'sports_athlete', 'athletes', 'pdf'),
  typeDef('athlete_membership_form', 'Deklaracja członkostwa', 'sports_athlete', 'athletes', 'pdf'),
  typeDef('athlete_photo_consent', 'Zgoda na wizerunek', 'sports_athlete', 'athletes', 'pdf'),
  typeDef('athlete_emergency_contact', 'Kontakt alarmowy', 'sports_athlete', 'athletes', 'csv'),
  typeDef('athlete_competition_record', 'Karta startowa zawodnika', 'sports_athlete', 'athletes', 'csv'),
  typeDef('athlete_anthropometry', 'Pomiary antropometryczne', 'sports_athlete', 'athletes', 'csv'),

  // —— Trenerzy (6) ——
  typeDef('coach_license', 'Licencja trenerska', 'sports_coach', 'coaches', 'pdf'),
  typeDef('coach_contract', 'Umowa z trenerem', 'sports_coach', 'coaches', 'pdf'),
  typeDef('coach_cpd_log', 'Szkolenia i certyfikaty', 'sports_coach', 'coaches', 'csv'),
  typeDef('coach_session_plan', 'Plan jednostki treningowej', 'sports_coach', 'coaches', 'html'),
  typeDef('coach_athlete_report', 'Raport postępów zawodnika', 'sports_coach', 'coaches', 'csv'),
  typeDef('coach_substitute_list', 'Lista zastępstw', 'sports_coach', 'coaches', 'csv'),

  // —— Zawody (9) ——
  typeDef('competition_regulations', 'Regulamin zawodów', 'sports_competition', 'competitions', 'html'),
  typeDef('competition_start_list', 'Lista startowa', 'sports_competition', 'start-lists', 'csv', {
    description: 'Generator listy startowej z bazy zawodników.',
    generatorKind: 'competition_start_list'
  }),
  typeDef('competition_protocol', 'Protokół zawodów', 'sports_competition', 'competitions', 'html'),
  typeDef('competition_results_sheet', 'Arkusz wyników', 'sports_competition', 'competitions', 'csv'),
  typeDef('competition_judges_sheet', 'Arkusz sędziowski', 'sports_competition', 'competitions', 'csv'),
  typeDef('competition_weigh_in', 'Protokół ważenia', 'sports_competition', 'competitions', 'csv'),
  typeDef('competition_medical_station', 'Stacja medyczna', 'sports_competition', 'competitions', 'csv'),
  typeDef('competition_venue_checklist', 'Checklista obiektu', 'sports_competition', 'competitions', 'csv'),
  typeDef('competition_transport_plan', 'Plan transportu', 'sports_competition', 'competitions', 'csv'),

  // —— Sprzęt (5) ——
  typeDef('equipment_inventory', 'Inwentaryzacja sprzętu', 'sports_equipment', 'equipment', 'csv'),
  typeDef('equipment_maintenance_log', 'Dziennik konserwacji', 'sports_equipment', 'equipment', 'csv'),
  typeDef('equipment_barbell_log', 'Rejestr sztang', 'sports_equipment', 'equipment', 'csv'),
  typeDef('equipment_purchase_request', 'Wniosek zakupowy', 'sports_equipment', 'equipment', 'csv'),
  typeDef('equipment_loan_agreement', 'Umowa wypożyczenia', 'sports_equipment', 'equipment', 'pdf'),

  // —— Zebrania zarządu (4) ——
  typeDef('admin_board_meeting_protocol', 'Protokół zebrania', 'admin_organizational', 'meeting-reports', 'csv', {
    description: 'Generator raportu obecności na zebranie.',
    generatorKind: 'meeting_report'
  }),
  typeDef('meeting_attendance_sheet', 'Lista obecności zarządu', 'admin_organizational', 'meeting-reports', 'csv'),
  typeDef('meeting_agenda', 'Porządek obrad', 'admin_organizational', 'meeting-reports', 'html'),
  typeDef('meeting_resolution', 'Uchwała zarządu', 'admin_organizational', 'organizational', 'html'),

  // —— Organizacyjne (5) ——
  typeDef('org_statute', 'Statut klubu', 'admin_organizational', 'organizational', 'html'),
  typeDef('org_bylaws', 'Regulamin klubu', 'admin_organizational', 'organizational', 'html'),
  typeDef('org_authorization', 'Pełnomocnictwo', 'admin_organizational', 'organizational', 'pdf'),
  typeDef('org_committee_charter', 'Regulamin komisji', 'admin_organizational', 'organizational', 'html'),
  typeDef('org_season_plan', 'Plan sezonu', 'admin_organizational', 'organizational', 'html'),

  // —— Finansowe (5) ——
  typeDef('fin_membership_fees', 'Składki członkowskie', 'admin_financial', 'financial', 'csv'),
  typeDef('fin_budget', 'Budżet klubu', 'admin_financial', 'financial', 'csv'),
  typeDef('fin_invoice', 'Faktura', 'admin_financial', 'financial', 'pdf'),
  typeDef('fin_grant_application', 'Wniosek o dotację', 'admin_financial', 'financial', 'html'),
  typeDef('fin_expense_report', 'Rozliczenie kosztów', 'admin_financial', 'financial', 'csv'),

  // —— Kadry i BHP (4) ——
  typeDef('hr_volunteer_agreement', 'Umowa wolontariusza', 'admin_hr', 'hr', 'pdf'),
  typeDef('hr_staff_list', 'Lista kadry', 'admin_hr', 'hr', 'csv'),
  typeDef('hr_bhp_training', 'Szkolenie BHP', 'admin_hr', 'hr', 'pdf'),
  typeDef('hr_incident_report', 'Raport incydentu BHP', 'admin_hr', 'hr', 'csv'),

  // —— Prawne (4) ——
  typeDef('legal_rodo_register', 'Rejestr czynności RODO', 'admin_legal', 'legal', 'csv'),
  typeDef('legal_insurance_policy', 'Polisa ubezpieczeniowa', 'admin_legal', 'legal', 'pdf'),
  typeDef('legal_minor_protection', 'Standard ochrony małoletnich', 'admin_legal', 'legal', 'html'),
  typeDef('legal_gdpr_request', 'Wniosek RODO', 'admin_legal', 'legal', 'pdf'),

  // —— Marketing (5) ——
  typeDef('mkt_social_media_plan', 'Plan social media', 'admin_marketing', 'marketing', 'html'),
  typeDef('mkt_press_release', 'Komunikat prasowy', 'admin_marketing', 'marketing', 'html'),
  typeDef('mkt_sponsor_proposal', 'Oferta sponsorska', 'admin_marketing', 'marketing', 'html'),
  typeDef('mkt_event_photos_release', 'Zgody foto — wydarzenie', 'admin_marketing', 'marketing', 'pdf'),
  typeDef('mkt_brand_guidelines', 'Wytyczne wizerunkowe', 'admin_marketing', 'marketing', 'html')
]

export const BUILTIN_BOARD_DOCUMENT_TYPE_MAP = new Map(
  BUILTIN_BOARD_DOCUMENT_TYPES.map(t => [t.id, t])
)

export function findBuiltinBoardDocumentType(typeId: string): BoardDocumentTypeDefinition | undefined {
  return BUILTIN_BOARD_DOCUMENT_TYPE_MAP.get(typeId)
}

export function boardDocumentTypeLabel(typeId: string | null | undefined): string {
  if (!typeId) return '—'
  return BUILTIN_BOARD_DOCUMENT_TYPE_MAP.get(typeId)?.label ?? typeId
}

export function boardDocumentCategoryForType(typeId: string | null | undefined): BoardDocumentCategoryId {
  if (!typeId) return 'custom'
  return BUILTIN_BOARD_DOCUMENT_TYPE_MAP.get(typeId)?.category ?? 'custom'
}

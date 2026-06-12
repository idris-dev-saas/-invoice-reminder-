import { Plan } from '@prisma/client'

export type ReminderType = 'J3' | 'J7' | 'J14'

export type PlanFeature =
  | { label: string; soon?: false }
  | { label: string; soon: true }

export const PLAN_CONFIG = {
  FREE: {
    invoiceLimit:    5,
    reminderTypes:   ['J3'] as ReminderType[],
    canExportPdf:    false,
    emailBranding:   true,
    label:           'Gratuit',
    price:           0,
    tagline:         'Pour tester et démarrer sans risque.',
    features:        [
      { label: '5 factures actives' },
      { label: 'Relance automatique J+3' },
      { label: 'Numérotation INV-0001...' },
      { label: 'Analytics de base' },
    ] satisfies PlanFeature[],
  },
  PRO: {
    invoiceLimit:    Infinity,
    reminderTypes:   ['J3', 'J7', 'J14'] as ReminderType[],
    canExportPdf:    true,
    emailBranding:   false,
    label:           'Pro',
    price:           12,
    tagline:         'Pour les freelances qui veulent tout automatiser.',
    features:        [
      { label: 'Factures illimitées' },
      { label: 'Relances J+3, J+7 et J+14' },
      { label: 'Export PDF professionnel' },
      { label: 'Sans branding Invoice Reminder' },
      { label: 'Analytics complets' },
    ] satisfies PlanFeature[],
  },
  BUSINESS: {
    invoiceLimit:    Infinity,
    reminderTypes:   ['J3', 'J7', 'J14'] as ReminderType[],
    canExportPdf:    true,
    emailBranding:   false,
    label:           'Business',
    price:           29,
    tagline:         'Pour usage intensif et équipes en croissance.',
    features:        [
      { label: 'Tout le plan Pro inclus' },
      { label: 'Factures et relances illimitées' },
      { label: 'Export PDF professionnel' },
      { label: 'Support prioritaire' },
      { label: 'Comptes multi-utilisateurs', soon: true },
      { label: 'Templates email personnalisés', soon: true },
    ] satisfies PlanFeature[],
  },
} satisfies Record<Plan, {
  invoiceLimit:  number
  reminderTypes: ReminderType[]
  canExportPdf:  boolean
  emailBranding: boolean
  label:         string
  price:         number
  tagline:       string
  features:      PlanFeature[]
}>

export function getInvoiceLimit(plan: Plan): number {
  return PLAN_CONFIG[plan].invoiceLimit
}

export function getReminderTypes(plan: Plan): ReminderType[] {
  return PLAN_CONFIG[plan].reminderTypes
}

export function canCreateInvoice(plan: Plan, currentCount: number): boolean {
  const limit = getInvoiceLimit(plan)
  return limit === Infinity || currentCount < limit
}

export function canUseReminder(plan: Plan, type: ReminderType): boolean {
  return PLAN_CONFIG[plan].reminderTypes.includes(type)
}

export function canExportPdf(plan: Plan): boolean {
  return PLAN_CONFIG[plan].canExportPdf
}

type Feature = 'canExportPdf' | 'emailBranding'
export function isFeatureEnabled(plan: Plan, feature: Feature): boolean {
  return PLAN_CONFIG[plan][feature]
}

/**
 * Invoice-domain entry point for all plan permission checks.
 * Import from here inside invoice logic — never call lib/plan directly
 * from business code so plan rules stay centralised.
 */
export {
  canCreateInvoice,
  canUseReminder,
  canExportPdf,
  isFeatureEnabled,
  getInvoiceLimit,
  getReminderTypes,
  type ReminderType,
} from '@/lib/plan'

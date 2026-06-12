import { InvoiceStatus } from '@prisma/client'

const classes: Record<InvoiceStatus, string> = {
  PAID:    'badge badge-paid',
  UNPAID:  'badge badge-unpaid',
  OVERDUE: 'badge badge-overdue',
}

const labels: Record<InvoiceStatus, string> = {
  PAID:    'Payée',
  UNPAID:  'Impayée',
  OVERDUE: 'En retard',
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <span className={classes[status]}>{labels[status]}</span>
}

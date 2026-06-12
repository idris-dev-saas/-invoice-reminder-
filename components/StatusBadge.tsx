type InvoiceStatus = 'PAID' | 'UNPAID' | 'OVERDUE'

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

export function StatusBadge({ status }: { status: string }) {
  const cls   = classes[status as InvoiceStatus] ?? 'badge'
  const label = labels[status as InvoiceStatus]  ?? status
  return <span className={cls}>{label}</span>
}

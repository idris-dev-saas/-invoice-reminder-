import { InvoiceStatus } from '@prisma/client'

const styles: Record<InvoiceStatus, string> = {
  PAID: 'bg-green-100 text-green-800',
  UNPAID: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
}

const labels: Record<InvoiceStatus, string> = {
  PAID: 'Payée',
  UNPAID: 'Impayée',
  OVERDUE: 'En retard',
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

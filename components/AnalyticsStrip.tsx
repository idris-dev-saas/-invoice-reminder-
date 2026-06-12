import { Invoice, InvoiceStatus } from '@prisma/client'

function fmt(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)
}

export function AnalyticsStrip({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) return null

  const paid    = invoices.filter((i) => i.status === InvoiceStatus.PAID)
  const unpaid  = invoices.filter((i) => i.status !== InvoiceStatus.PAID)
  const overdue = invoices.filter((i) => i.status === InvoiceStatus.OVERDUE)

  const totalPaid   = paid.reduce((s, i) => s + i.amount, 0)
  const totalUnpaid = unpaid.reduce((s, i) => s + i.amount, 0)
  const successRate = invoices.length > 0
    ? Math.round((paid.length / invoices.length) * 100)
    : 0

  const currency = invoices[0]?.currency ?? 'EUR'

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <span className="kpi-value kpi-value-success">{fmt(totalPaid, currency)}</span>
        <span className="kpi-label">Encaissé</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-value kpi-value-warn">{fmt(totalUnpaid, currency)}</span>
        <span className="kpi-label">En attente</span>
      </div>
      <div className={`kpi-card${overdue.length > 0 ? ' kpi-card-danger' : ''}`}>
        <span className="kpi-value">{overdue.length}</span>
        <span className="kpi-label">En retard</span>
      </div>
      <div className="kpi-card">
        <span className="kpi-value">{successRate}%</span>
        <span className="kpi-label">Recouvrement</span>
      </div>
    </div>
  )
}

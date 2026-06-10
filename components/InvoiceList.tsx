'use client'
import { Invoice, InvoiceStatus } from '@prisma/client'
import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { InvoiceForm } from './InvoiceForm'
import { useRouter } from 'next/navigation'

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  async function markAsPaid(id: string) {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: InvoiceStatus.PAID }),
    })
    router.refresh()
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Supprimer cette facture ?')) return
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nouvelle facture
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-slate-500">Aucune facture. Créez-en une !</div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className={`bg-white rounded-xl border p-4 flex items-center justify-between ${
                invoice.status === 'OVERDUE' ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div>
                <p className="font-medium text-slate-900">{invoice.clientName}</p>
                <p className="text-sm text-slate-500">{invoice.clientEmail}</p>
                <p className="text-sm text-slate-500">
                  Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-slate-900">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(invoice.amount)}
                </p>
                <StatusBadge status={invoice.status} />
                {invoice.status !== 'PAID' && (
                  <button
                    onClick={() => markAsPaid(invoice.id)}
                    className="text-xs text-green-700 border border-green-300 px-2 py-1 rounded hover:bg-green-50"
                  >
                    Marquer payée
                  </button>
                )}
                <button
                  onClick={() => deleteInvoice(invoice.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <InvoiceForm onClose={() => setShowForm(false)} />}
    </>
  )
}

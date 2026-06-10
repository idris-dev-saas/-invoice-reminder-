'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InvoiceForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const dueDateValue = (form.elements.namedItem('dueDate') as HTMLInputElement).value
    const dueDate = new Date(dueDateValue)

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: (form.elements.namedItem('clientName') as HTMLInputElement).value,
        clientEmail: (form.elements.namedItem('clientEmail') as HTMLInputElement).value,
        amount: parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value),
        currency: (form.elements.namedItem('currency') as HTMLInputElement).value,
        dueDate: dueDate.toISOString(),
      }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Erreur lors de la création')
    } else {
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Nouvelle facture</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom du client
            </label>
            <input
              name="clientName"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email du client
            </label>
            <input
              name="clientEmail"
              type="email"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-slate-700 mb-1">Devise</label>
              <input
                name="currency"
                defaultValue="EUR"
                maxLength={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date d&apos;échéance
            </label>
            <input
              name="dueDate"
              type="date"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

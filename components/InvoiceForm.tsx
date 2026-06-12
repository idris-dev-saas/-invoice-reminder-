'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  onClose: () => void
  onPlanError?: (msg: string) => void
}

export function InvoiceForm({ onClose, onPlanError }: Props) {
  const router   = useRouter()
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [dateText,  setDateText]  = useState('')
  const [dateIso,   setDateIso]   = useState('')
  const pickerRef = useRef<HTMLInputElement>(null)

  function handleDateText(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setDateText(val)

    const m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (!m) {
      setDateIso('')
      e.target.setCustomValidity('')
      return
    }

    const d  = parseInt(m[1], 10)
    const mo = parseInt(m[2], 10)
    const y  = parseInt(m[3], 10)

    // Validate ranges before letting JS silently overflow (e.g. 30/02 → 02/03)
    if (mo < 1 || mo > 12 || d < 1 || d > 31) {
      setDateIso('')
      e.target.setCustomValidity('Date invalide.')
      return
    }

    // Check that JS doesn't overflow the date (e.g. 30/02/2026 → March 2)
    const parsed = new Date(y, mo - 1, d)
    if (parsed.getFullYear() !== y || parsed.getMonth() + 1 !== mo || parsed.getDate() !== d) {
      setDateIso('')
      e.target.setCustomValidity(`Jour invalide pour le mois ${mo}.`)
      return
    }

    const iso   = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const today = new Date().toISOString().split('T')[0]
    if (iso < today) {
      setDateIso('')
      e.target.setCustomValidity("La date d'échéance ne peut pas être dans le passé.")
      return
    }

    e.target.setCustomValidity('')
    setDateIso(iso)
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const iso = e.target.value
    setDateIso(iso)
    if (iso) {
      const [y, mo, d] = iso.split('-')
      setDateText(`${d}/${mo}/${y}`)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const dueDate = dateIso
      ? new Date(dateIso)
      : new Date((form.elements.namedItem('dueDate') as HTMLInputElement).value)

    const res = await fetch('/api/invoices', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName:  (form.elements.namedItem('clientName') as HTMLInputElement).value,
        clientEmail: (form.elements.namedItem('clientEmail') as HTMLInputElement).value,
        amount:      parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value),
        currency:    (form.elements.namedItem('currency') as HTMLInputElement).value,
        dueDate:     dueDate.toISOString(),
      }),
    })
    setLoading(false)

    if (res.status === 403) {
      const data = await res.json()
      if (onPlanError) onPlanError(data.error ?? 'Limite du plan atteinte.')
      return
    }
    if (!res.ok) {
      setError('Erreur lors de la création. Vérifiez les champs.')
    } else {
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel">
        <h2 className="modal-title">Nouvelle facture</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="clientName">Client</label>
            <input
              id="clientName"
              name="clientName"
              required
              className="form-input"
              placeholder="Nom ou entreprise"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="clientEmail">Email du client</label>
            <input
              id="clientEmail"
              name="clientEmail"
              type="email"
              required
              className="form-input"
              placeholder="client@exemple.com"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="amount">Montant</label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                className="form-input"
                placeholder="0.00"
              />
            </div>
            <div className="form-group form-group-sm">
              <label className="form-label" htmlFor="currency">Devise</label>
              <input
                id="currency"
                name="currency"
                defaultValue="EUR"
                maxLength={3}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="dueDateText">Date d&apos;échéance</label>
            <div className="date-field">
              <input
                id="dueDateText"
                type="text"
                inputMode="numeric"
                placeholder="JJ/MM/AAAA"
                value={dateText}
                onChange={handleDateText}
                required={!dateIso}
                pattern="\d{1,2}/\d{1,2}/\d{4}"
                className="form-input"
              />
              <button
                type="button"
                className="date-calendar-btn"
                onClick={() => pickerRef.current?.showPicker()}
                aria-label="Ouvrir le calendrier"
                tabIndex={-1}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M1 7h14" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <input
                ref={pickerRef}
                name="dueDate"
                type="date"
                value={dateIso}
                min={new Date().toISOString().split('T')[0]}
                onChange={handlePickerChange}
                className="date-picker-hidden"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary btn-full">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-full">
              {loading ? 'Création...' : 'Créer la facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

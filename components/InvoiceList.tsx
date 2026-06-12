'use client'
import { useState } from 'react'
import { StatusBadge }    from './StatusBadge'
import { InvoiceForm }    from './InvoiceForm'
import { EmptyState }     from './EmptyState'
import { OnboardingTip }  from './OnboardingTip'
import { InvoiceActions } from './InvoiceActions'
import { useToast }       from './Toast'
import { useRouter }      from 'next/navigation'

type ReminderLog = { id: string; sentAt: Date | string; reminderType: string }
type InvoiceWithReminders = {
  id:            string
  invoiceNumber: number | null
  clientName:    string
  clientEmail:   string
  amount:        number
  currency:      string
  dueDate:       Date | string
  status:        string
  paidAt:        Date | string | null
  reminders:     ReminderLog[]
}
type Props = {
  invoices: InvoiceWithReminders[]
  canPdf?:  boolean
  plan?:    string
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function invoiceRef(invoice: InvoiceWithReminders) {
  if (invoice.invoiceNumber != null) {
    return `INV-${String(invoice.invoiceNumber).padStart(4, '0')}`
  }
  return `#${invoice.id.slice(-6).toUpperCase()}`
}

const REMINDER_LABELS: Record<string, string> = { J3: 'J+3', J7: 'J+7', J14: 'J+14' }

export function InvoiceList({ invoices, canPdf = false, plan }: Props) {
  const [showForm,     setShowForm]     = useState(false)
  const [planError,    setPlanError]    = useState('')
  const [payingId,     setPayingId]     = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const router = useRouter()
  const toast  = useToast()

  async function markAsPaid(id: string) {
    setPayingId(id)
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'PAID' }),
      })
      if (!res.ok) throw new Error()
      toast.success('Facture marquée payée')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setPayingId(null)
    }
  }

  async function executeDelete(id: string) {
    setConfirmingId(null)
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Facture supprimée')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  function handleCreateAttempt() {
    setPlanError('')
    setShowForm(true)
  }

  function handleFormError(msg: string) {
    setShowForm(false)
    setPlanError(msg)
  }

  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length

  return (
    <>
      {plan && (
        <OnboardingTip plan={plan} invoiceCount={invoices.length} />
      )}

      <div className="invoice-toolbar">
        <div className="invoice-toolbar-left">
          <h1 className="page-title">Factures</h1>
          {overdueCount > 0 && (
            <span className="overdue-alert">
              {overdueCount} en retard de paiement
            </span>
          )}
        </div>
        <button onClick={handleCreateAttempt} className="btn btn-primary">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Nouvelle facture
        </button>
      </div>

      {planError && (
        <div className="plan-error-banner">
          {planError}
          {' '}<a href="/dashboard/billing" className="plan-error-link">Passer au Pro →</a>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="invoice-list">
          <EmptyState onCreateClick={handleCreateAttempt} />
        </div>
      ) : (
        <div className="invoice-list">
          <div className="invoice-list-header">
            <span>Réf.</span>
            <span>Client</span>
            <span className="col-amount">Montant</span>
            <span>Échéance</span>
            <span>Statut</span>
            <span />
          </div>

          {invoices.map((invoice) => {
            if (confirmingId === invoice.id) {
              return (
                <div key={invoice.id} className="invoice-row invoice-row-confirming">
                  <div className="delete-confirm-bar">
                    <span className="delete-confirm-text">
                      Supprimer <strong>{invoiceRef(invoice)}</strong> définitivement ?
                    </span>
                    <div className="delete-confirm-actions">
                      <button
                        className="btn-confirm-delete"
                        onClick={() => executeDelete(invoice.id)}
                      >
                        Supprimer
                      </button>
                      <button
                        className="btn-confirm-cancel"
                        onClick={() => setConfirmingId(null)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={invoice.id}
                className={`invoice-row${invoice.status === 'OVERDUE' ? ' is-overdue' : ''}`}
              >
                <span className="invoice-ref">{invoiceRef(invoice)}</span>

                <div className="invoice-client">
                  <div className="invoice-client-row">
                    <span className="invoice-client-name">{invoice.clientName}</span>
                    {invoice.reminders.length > 0 && (
                      <div className="invoice-reminders">
                        {invoice.reminders.map((r) => (
                          <span
                            key={r.id}
                            className="reminder-chip"
                            title={`Envoyé le ${new Date(r.sentAt).toLocaleDateString('fr-FR')}`}
                          >
                            {REMINDER_LABELS[r.reminderType] ?? r.reminderType}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="invoice-client-email">{invoice.clientEmail}</span>
                </div>

                <span className="invoice-amount">
                  {formatAmount(invoice.amount, invoice.currency)}
                </span>

                <span className="invoice-due">{formatDate(invoice.dueDate)}</span>

                <div className="invoice-status-cell">
                  <StatusBadge status={invoice.status} />
                  {invoice.paidAt && (
                    <span className="invoice-paid-date">{formatDate(invoice.paidAt)}</span>
                  )}
                </div>

                <div className="invoice-actions">
                  <InvoiceActions
                    invoiceId={invoice.id}
                    status={invoice.status}
                    canPdf={canPdf}
                    isLoading={payingId === invoice.id}
                    onMarkPaid={() => markAsPaid(invoice.id)}
                    onDeleteIntent={() => setConfirmingId(invoice.id)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <InvoiceForm
          onClose={() => setShowForm(false)}
          onPlanError={handleFormError}
        />
      )}
    </>
  )
}

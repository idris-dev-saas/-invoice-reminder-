'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export function PortalButton({
  label = "Gérer l'abonnement",
  className = 'btn btn-secondary btn-full',
}: {
  label?:     string
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')

  async function openPortal() {
    setLoading(true)
    setErr('')
    try {
      const res  = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setErr(data.error ?? "Impossible d'ouvrir le portail Stripe.")
        setLoading(false)
      }
    } catch {
      setErr('Erreur réseau.')
      setLoading(false)
    }
  }

  return (
    <div className="btn-action-wrap">
      <button className={className} onClick={openPortal} disabled={loading}>
        {loading ? 'Chargement...' : label}
      </button>
      {err && <p className="btn-inline-error">{err}</p>}
    </div>
  )
}

interface Props {
  isPaid:        boolean
  hasCustomer:   boolean
  currentPlan:   string
  checkoutPlan?: 'PRO' | 'BUSINESS'
  checkoutLabel?: string
  minimal?:      boolean
}

type UpgradeResult = {
  status:            'success'
  oldPlan:           string
  newPlan:           string
  prorationApplied:  boolean
  amountChargedNow:  number
  nextBillingAmount: number
}

function UpgradeModal({ result, onClose }: { result: UpgradeResult; onClose: () => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null
  const charged = result.amountChargedNow > 0
    ? `${result.amountChargedNow.toFixed(2)} € ont été prélevés immédiatement (prorata).`
    : 'Aucun prélèvement immédiat.'

  return createPortal(
    <div className="upgrade-modal-backdrop">
      <div className="upgrade-modal-panel">
        <button className="upgrade-modal-close" onClick={onClose} aria-label="Fermer">✕</button>

        <div className="upgrade-modal-header">
          <div className="upgrade-modal-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11.5l5 5 9-9" stroke="oklch(45% 0.15 145)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="upgrade-modal-title">Plan mis à jour</h2>
          <p className="upgrade-modal-sub">
            Votre abonnement est maintenant <strong>{result.newPlan}</strong>.
          </p>
        </div>

        <div className="upgrade-modal-details">
          <div className="upgrade-modal-row">
            <span className="upgrade-modal-label">Prélevé maintenant</span>
            <span className="upgrade-modal-value">
              {result.amountChargedNow > 0 ? `${result.amountChargedNow.toFixed(2)} €` : '0 €'}
            </span>
          </div>
          <div className="upgrade-modal-row">
            <span className="upgrade-modal-label">Prochaine facture</span>
            <span className="upgrade-modal-value">{result.nextBillingAmount} €/mois</span>
          </div>
          <p className="upgrade-modal-note">{charged}</p>
        </div>

        <button className="btn btn-primary btn-full" onClick={onClose}>
          Continuer
        </button>
      </div>
    </div>,
    document.body,
  )
}

export function UpgradeButton({
  plan,
  label,
  className = 'btn btn-primary btn-full',
}: {
  plan:       'PRO' | 'BUSINESS'
  label:      string
  className?: string
}) {
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const [result,  setResult]  = useState<UpgradeResult | null>(null)

  async function upgrade() {
    setLoading(true)
    setErr('')
    setResult(null)
    try {
      const res  = await fetch('/api/stripe/upgrade', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.status === 'success') {
        setResult(data)
      } else {
        setErr(data.error ?? 'Erreur lors de la mise à niveau.')
        setLoading(false)
      }
    } catch {
      setErr('Erreur réseau.')
      setLoading(false)
    }
  }

  function handleClose() {
    window.location.href = '/dashboard/billing?success=1'
  }

  return (
    <>
      {result && <UpgradeModal result={result} onClose={handleClose} />}
      <div className="btn-action-wrap">
        <button className={className} onClick={upgrade} disabled={loading}>
          {loading ? 'Mise à niveau...' : label}
        </button>
        {err && <p className="btn-inline-error">{err}</p>}
      </div>
    </>
  )
}

export function BillingActions({
  isPaid, hasCustomer, checkoutPlan, checkoutLabel, minimal,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function startCheckout(plan: 'PRO' | 'BUSINESS') {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  async function openPortal() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  if (minimal && checkoutPlan) {
    return (
      <button
        className="btn btn-primary btn-full"
        onClick={() => startCheckout(checkoutPlan)}
        disabled={loading}
      >
        {loading ? 'Chargement...' : checkoutLabel ?? `Passer au ${checkoutPlan}`}
      </button>
    )
  }

  if (isPaid) {
    return (
      <button
        className="btn btn-secondary"
        onClick={openPortal}
        disabled={loading}
      >
        {loading ? 'Chargement...' : "Gérer l'abonnement"}
      </button>
    )
  }

  return null
}

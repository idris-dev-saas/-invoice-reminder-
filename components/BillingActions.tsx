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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button className={className} onClick={openPortal} disabled={loading}>
        {loading ? 'Chargement...' : label}
      </button>
      {err && <p style={{ fontSize: '12px', color: 'var(--danger)', margin: 0 }}>{err}</p>}
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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'oklch(0% 0 0 / 0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--surface, #fff)',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '420px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 20px 60px oklch(0% 0 0 / 0.18)',
      }}>
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted, #888)', fontSize: '20px', lineHeight: 1,
            padding: '4px',
          }}
        >✕</button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'oklch(95% 0.05 145)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M4 11.5l5 5 9-9" stroke="oklch(45% 0.15 145)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: 'var(--text, #111)' }}>
            Plan mis à jour !
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted, #666)', fontSize: '14px' }}>
            Votre abonnement est maintenant <strong>{result.newPlan}</strong>.
          </p>
        </div>

        <div style={{
          background: 'var(--surface-subtle, #f8f9fa)',
          borderRadius: '10px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted, #666)' }}>Prélevé maintenant</span>
            <span style={{ fontWeight: 600, color: 'var(--text, #111)' }}>
              {result.amountChargedNow > 0 ? `${result.amountChargedNow.toFixed(2)} €` : '0 €'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'var(--text-muted, #666)' }}>Prochaine facture</span>
            <span style={{ fontWeight: 600, color: 'var(--text, #111)' }}>{result.nextBillingAmount} €/mois</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted, #888)' }}>{charged}</p>
        </div>

        <button className="btn btn-primary btn-full" onClick={onClose}>
          OK
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button className={className} onClick={upgrade} disabled={loading}>
          {loading ? 'Mise à niveau...' : label}
        </button>
        {err && <p style={{ fontSize: '12px', color: 'var(--danger)', margin: 0 }}>{err}</p>}
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

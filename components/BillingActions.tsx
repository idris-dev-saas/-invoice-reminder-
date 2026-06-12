'use client'
import { useState } from 'react'

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

  async function upgrade() {
    setLoading(true)
    setErr('')
    try {
      const res  = await fetch('/api/stripe/upgrade', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.ok) {
        window.location.href = '/dashboard/billing?success=1'
      } else {
        setErr(data.error ?? 'Erreur lors de la mise à niveau.')
        setLoading(false)
      }
    } catch {
      setErr('Erreur réseau.')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button className={className} onClick={upgrade} disabled={loading}>
        {loading ? 'Chargement...' : label}
      </button>
      {err && <p style={{ fontSize: '12px', color: 'var(--danger)', margin: 0 }}>{err}</p>}
    </div>
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

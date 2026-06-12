'use client'
import Link from 'next/link'

export function PlanBanner({ plan, invoiceCount }: { plan: string; invoiceCount: number }) {
  if (plan !== 'FREE') return null

  const remaining = 5 - invoiceCount
  const atLimit   = remaining <= 0

  return (
    <div className={`plan-banner${atLimit ? ' plan-banner-limit' : ''}`}>
      <span>
        {atLimit
          ? 'Limite atteinte — passez au plan Pro pour créer des factures illimitées.'
          : `Plan Gratuit — ${invoiceCount}/5 factures. Relances limitées à J+3.`}
      </span>
      <Link href="/dashboard/billing" className="plan-banner-link">
        Passer au Pro →
      </Link>
    </div>
  )
}

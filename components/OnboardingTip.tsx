import Link from 'next/link'
import { Plan } from '@prisma/client'

export function OnboardingTip({ plan, invoiceCount }: { plan: Plan; invoiceCount: number }) {
  if (plan !== Plan.FREE) return null
  if (invoiceCount === 0 || invoiceCount > 5) return null

  return (
    <div className="onboarding-tip">
      <span className="onboarding-tip-check" aria-hidden="true">✓</span>
      <span className="onboarding-tip-text">
        Relances automatiques actives — les factures impayées reçoivent un rappel à J+3 automatiquement.
      </span>
      <Link href="/dashboard/billing" className="onboarding-tip-link">
        Activer J+7 et J+14 →
      </Link>
    </div>
  )
}

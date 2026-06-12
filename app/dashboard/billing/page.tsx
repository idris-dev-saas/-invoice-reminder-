import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { PLAN_CONFIG, type PlanFeature } from '@/lib/plan'
import { BillingActions, UpgradeButton } from '@/components/BillingActions'
import { Plan } from '@prisma/client'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const { success, canceled } = await searchParams

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan:                true,
      subscriptionStatus:  true,
      stripeCustomerId:    true,
      _count: { select: { invoices: true } },
    },
  })
  if (!user) redirect('/login')

  const isPaid    = user.plan !== Plan.FREE
  const planLabel = PLAN_CONFIG[user.plan].label
  const limit     = PLAN_CONFIG[user.plan].invoiceLimit

  return (
    <>
      <header className="app-header">
        <div className="content-wrap">
          <div className="app-logo">
            <span className="app-logo-dot" />
            Invoice Reminder
          </div>
          <nav className="header-nav">
            <a href="/dashboard" className="header-link">Factures</a>
            <a href="/dashboard/billing" className="header-link is-active">Abonnement</a>
          </nav>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="content-wrap billing-wrap">

          {success && (
            <div className="billing-alert billing-alert-success">
              Paiement réussi — votre plan a été mis à jour.
            </div>
          )}
          {canceled && (
            <div className="billing-alert billing-alert-warn">
              Paiement annulé. Votre plan n'a pas changé.
            </div>
          )}

          <h1 className="page-title">Abonnement</h1>

          {/* Current plan card */}
          <div className="billing-current">
            <div className="billing-current-left">
              <span className="billing-plan-badge">{planLabel}</span>
              {isPaid && user.subscriptionStatus && (
                <span className={`billing-status-badge billing-status-${user.subscriptionStatus.toLowerCase()}`}>
                  {user.subscriptionStatus === 'ACTIVE'   ? 'Actif'
                  : user.subscriptionStatus === 'PAST_DUE' ? 'Paiement en retard'
                  : user.subscriptionStatus === 'TRIALING' ? 'Essai'
                  : 'Annulation en cours'}
                </span>
              )}
              <p className="billing-usage">
                {user._count.invoices} facture{user._count.invoices !== 1 ? 's' : ''} créée{user._count.invoices !== 1 ? 's' : ''}
                {limit !== Infinity && ` / ${limit}`}
              </p>
            </div>
            <BillingActions
              isPaid={isPaid}
              hasCustomer={!!user.stripeCustomerId}
              currentPlan={user.plan}
            />
          </div>

          {/* Pricing comparison — always shown */}
          <div className="pricing-grid pricing-grid-3">
            {([Plan.FREE, Plan.PRO, Plan.BUSINESS] as const).map((p) => {
              const cfg = PLAN_CONFIG[p]
              return (
                <PricingCard
                  key={p}
                  name={cfg.label}
                  price={String(cfg.price)}
                  tagline={cfg.tagline}
                  features={cfg.features}
                  plan={
                    p === Plan.FREE ? null
                    : p === Plan.PRO && user.plan === Plan.FREE ? 'PRO'
                    : p === Plan.BUSINESS && user.plan === Plan.FREE ? 'BUSINESS'
                    : null
                  }
                  highlight={p === Plan.PRO && user.plan !== Plan.BUSINESS}
                  current={user.plan === p}
                  portalAction={
                    p === Plan.PRO && user.plan === Plan.BUSINESS
                      ? { label: 'Rétrograder au Pro' }
                      : undefined
                  }
                  upgradeAction={
                    p === Plan.BUSINESS && user.plan === Plan.PRO
                      ? { label: 'Passer au Business' }
                      : undefined
                  }
                />
              )
            })}
          </div>
        </div>
      </main>
    </>
  )
}

function PricingCard({
  name, price, tagline, features, plan, highlight = false, current = false, portalAction, upgradeAction,
}: {
  name:           string
  price:          string
  tagline:        string
  features:       PlanFeature[]
  plan:           'PRO' | 'BUSINESS' | null
  highlight?:     boolean
  current?:       boolean
  portalAction?:  { label: string; primary?: boolean }
  upgradeAction?: { label: string }
}) {
  const classes = [
    'pricing-card',
    highlight ? 'pricing-card-highlight' : '',
    current   ? 'pricing-card-current'   : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {highlight && !current && <span className="pricing-badge">Recommandé</span>}
      {current               && <span className="pricing-badge pricing-badge-current">Plan actuel</span>}
      <h2 className="pricing-name">{name}</h2>
      <p className="pricing-tagline">{tagline}</p>
      <div className="pricing-price">
        <span className="pricing-amount">{price}€</span>
        <span className="pricing-period">/mois</span>
      </div>
      <ul className="pricing-features">
        {features.map((f) => (
          <li key={f.label} className={f.soon ? 'pricing-feature-soon' : ''}>
            <span>{f.label}</span>
            {f.soon && <span className="pricing-soon-tag">Bientôt</span>}
          </li>
        ))}
      </ul>
      {current ? (
        <div className="pricing-current-label">Plan actif</div>
      ) : plan ? (
        <form action="/api/stripe/checkout" method="POST" className="pricing-form">
          <input type="hidden" name="plan" value={plan} />
          <BillingCheckoutButton plan={plan} label={`Passer au ${name}`} />
        </form>
      ) : upgradeAction ? (
        <UpgradeButton plan="BUSINESS" label={upgradeAction.label} />
      ) : portalAction ? (
        <div className="pricing-downgrade-note">
          Pour rétrograder, contactez le support.
        </div>
      ) : null}
    </div>
  )
}

function BillingCheckoutButton({ plan, label }: { plan: 'PRO' | 'BUSINESS'; label: string }) {
  return (
    <BillingActions
      isPaid={false}
      hasCustomer={false}
      currentPlan={Plan.FREE}
      checkoutPlan={plan}
      checkoutLabel={label}
      minimal
    />
  )
}

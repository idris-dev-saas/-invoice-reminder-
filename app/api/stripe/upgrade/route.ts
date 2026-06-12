import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, PRICE_IDS } from '@/lib/stripe'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import Stripe from 'stripe'

const upgradeSchema = z.object({
  plan: z.enum(['PRO', 'BUSINESS']),
})

const PLAN_PRICES: Record<string, number> = { PRO: 12, BUSINESS: 29 }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const parsed = upgradeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 })

  const { plan } = parsed.data

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { stripeSubscriptionId: true, plan: true },
  })
  if (!user)                      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
  if (!user.stripeSubscriptionId) return NextResponse.json({ error: 'Aucun abonnement actif.' }, { status: 400 })
  if (user.plan === plan)         return NextResponse.json({ error: 'Vous êtes déjà sur ce plan.' }, { status: 400 })

  let subscription: Stripe.Subscription
  try {
    subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
  } catch {
    return NextResponse.json({ error: 'Abonnement Stripe introuvable.' }, { status: 400 })
  }

  if (subscription.status === 'past_due') {
    return NextResponse.json({
      error: 'Votre paiement est en retard. Mettez à jour votre moyen de paiement avant de changer de plan.',
    }, { status: 402 })
  }
  if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
    return NextResponse.json({ error: 'Votre abonnement est inactif. Contactez le support.' }, { status: 400 })
  }

  const item = subscription.items.data[0]
  if (!item) return NextResponse.json({ error: 'Abonnement invalide.' }, { status: 400 })

  const customerId = subscription.customer as string
  const now        = Math.floor(Date.now() / 1000)

  // Preview proration amount (best-effort, doesn't block upgrade)
  let amountChargedNow = 0
  try {
    const preview = await stripe.invoices.createPreview({
      customer:     customerId,
      subscription: user.stripeSubscriptionId,
      subscription_details: {
        items:              [{ id: item.id, price: PRICE_IDS[plan] }],
        proration_behavior: 'create_prorations',
        proration_date:     now,
      },
    })
    amountChargedNow = Math.max(
      0,
      preview.lines.data
        .filter((l) =>
          l.parent?.subscription_item_details?.proration === true ||
          l.parent?.invoice_item_details?.proration === true
        )
        .reduce((sum, l) => sum + l.amount, 0) / 100,
    )
  } catch {
    // Preview failed — proceed anyway
  }

  // Step 1: Update the subscription (critical — must succeed)
  try {
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items:              [{ id: item.id, price: PRICE_IDS[plan] }],
      proration_behavior: 'create_prorations',
      metadata:           { userId: session.user.id, plan },
    })
  } catch (err) {
    const stripeErr = err as { code?: string; type?: string; message: string }
    logger.error({ event: 'upgrade_failed', userId: session.user.id, error: stripeErr.message })
    if (stripeErr.code === 'card_declined' || stripeErr.type === 'StripeCardError') {
      return NextResponse.json({ error: 'Carte refusée. Vérifiez votre moyen de paiement.' }, { status: 402 })
    }
    return NextResponse.json({ error: 'Erreur Stripe. Réessayez dans quelques instants.' }, { status: 500 })
  }

  // Step 2: Immediately pay the proration (best-effort — subscription is already updated)
  if (amountChargedNow > 0) {
    try {
      // Look for a draft invoice Stripe may have auto-created, or create one
      const drafts = await stripe.invoices.list({
        customer:     customerId,
        subscription: user.stripeSubscriptionId,
        status:       'draft',
        limit:        1,
      })
      const invoiceId = drafts.data.length > 0
        ? drafts.data[0].id
        : (await stripe.invoices.create({ customer: customerId, subscription: user.stripeSubscriptionId })).id

      await stripe.invoices.finalizeInvoice(invoiceId)
      await stripe.invoices.pay(invoiceId)
    } catch (invoiceErr) {
      // Immediate payment failed — proration will appear on next cycle, not a fatal error
      logger.error({ event: 'upgrade_failed', userId: session.user.id, error: String(invoiceErr) })
      amountChargedNow = 0
    }
  }

  logger.info({ event: 'plan_upgraded', userId: session.user.id, oldPlan: user.plan, newPlan: plan })

  return NextResponse.json({
    status:            'success',
    oldPlan:           user.plan,
    newPlan:           plan,
    prorationApplied:  true,
    amountChargedNow:  Math.round(amountChargedNow * 100) / 100,
    nextBillingAmount: PLAN_PRICES[plan] ?? 0,
  })
}

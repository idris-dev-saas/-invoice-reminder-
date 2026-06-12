import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { Plan, SubscriptionStatus } from '@prisma/client'
import Stripe from 'stripe'

export const runtime = 'nodejs'

function planFromPrice(priceId: string): Plan {
  if (priceId === process.env.STRIPE_PRO_PRICE_ID)      return Plan.PRO
  if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID) return Plan.BUSINESS
  return Plan.FREE
}

function stripeStatusToDb(status: Stripe.Subscription['status']): SubscriptionStatus | null {
  const map: Partial<Record<Stripe.Subscription['status'], SubscriptionStatus>> = {
    active:   SubscriptionStatus.ACTIVE,
    trialing: SubscriptionStatus.TRIALING,
    past_due: SubscriptionStatus.PAST_DUE,
    canceled: SubscriptionStatus.CANCELED,
    unpaid:   SubscriptionStatus.PAST_DUE,
  }
  return map[status] ?? null
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId
  if (!userId) {
    logger.error({ event: 'stripe_webhook_error', reason: 'missing_userId', subscriptionId: sub.id })
    return
  }

  const priceId = sub.items.data[0]?.price.id ?? ''
  const plan    = planFromPrice(priceId)
  const status  = stripeStatusToDb(sub.status)

  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!exists) {
    logger.error({ event: 'stripe_webhook_error', reason: 'user_not_found', userId })
    return
  }

  await prisma.user.update({
    where: { id: userId },
    data:  { plan, subscriptionStatus: status, stripeSubscriptionId: sub.id },
  })

  logger.info({ event: 'stripe_webhook_processed', userId, plan, stripeStatus: sub.status })
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId
  if (!userId) return

  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!exists) {
    logger.error({ event: 'stripe_webhook_error', reason: 'user_not_found', userId })
    return
  }

  await prisma.user.update({
    where: { id: userId },
    data:  { plan: Plan.FREE, subscriptionStatus: SubscriptionStatus.CANCELED, stripeSubscriptionId: null },
  })

  logger.info({ event: 'stripe_webhook_processed', userId, plan: 'FREE', reason: 'subscription_deleted' })
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    logger.error({ event: 'stripe_webhook_error', reason: 'signature_failed', error: String(err) })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  logger.info({ event: 'stripe_webhook_received', stripeEventId: event.id, stripeEventType: event.type })

  // Claim the event FIRST (idempotency).
  // If the claim succeeds, we own processing. If it fails with P2002, already done.
  // If processing fails after claiming, we delete the claim so Stripe can retry.
  try {
    await prisma.stripeEventLog.create({ data: { id: event.id, type: event.type } })
  } catch (e: unknown) {
    const code = (e as { code?: string }).code
    if (code === 'P2002') {
      logger.info({ event: 'stripe_webhook_skipped', stripeEventId: event.id, reason: 'already_processed' })
      return NextResponse.json({ received: true })
    }
    logger.error({ event: 'stripe_webhook_error', stripeEventId: event.id, reason: 'log_create_failed' })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sess = event.data.object as Stripe.Checkout.Session
        if (sess.mode === 'subscription' && sess.subscription) {
          const sub = await stripe.subscriptions.retrieve(sess.subscription as string)
          await handleSubscriptionUpsert(sub)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.payment_failed': {
        const inv   = event.data.object as Stripe.Invoice & { subscription?: string | null }
        const subId = typeof inv.subscription === 'string' ? inv.subscription : null
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await handleSubscriptionUpsert(sub)
        }
        break
      }
      default:
        break
    }
  } catch (err) {
    // Processing failed — remove the claim so Stripe can retry this event
    await prisma.stripeEventLog.delete({ where: { id: event.id } }).catch(() => {})
    logger.error({ event: 'stripe_webhook_error', stripeEventId: event.id, stripeEventType: event.type, error: String(err) })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

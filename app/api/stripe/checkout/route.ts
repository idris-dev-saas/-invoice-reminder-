import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, PRICE_IDS } from '@/lib/stripe'
import { z } from 'zod'
import { Plan } from '@prisma/client'

const checkoutSchema = z.object({
  plan: z.enum(['PRO', 'BUSINESS']),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 })

  const { plan } = parsed.data

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, email: true, name: true, stripeCustomerId: true, plan: true, stripeSubscriptionId: true },
  })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })

  // Block if already on a paid plan OR if a subscription already exists in DB.
  // This prevents creating a second subscription if the webhook previously failed
  // to update the plan field.
  if (user.plan !== Plan.FREE || user.stripeSubscriptionId) {
    return NextResponse.json({ error: 'Un abonnement actif existe déjà.' }, { status: 400 })
  }

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    user.email,
      name:     user.name ?? undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: user.id },
      data:  { stripeCustomerId: customerId },
    })
  }

  let checkoutSession
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      customer:          customerId,
      mode:              'subscription',
      line_items:        [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url:       `${process.env.NEXTAUTH_URL}/dashboard/billing?success=1`,
      cancel_url:        `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=1`,
      metadata:          { userId: user.id, plan },
      subscription_data: { metadata: { userId: user.id, plan } },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[checkout] Stripe error:', msg)
    return NextResponse.json({ error: `Erreur Stripe : ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ url: checkoutSession.url })
}

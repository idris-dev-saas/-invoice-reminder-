import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, PRICE_IDS } from '@/lib/stripe'
import { z } from 'zod'

const upgradeSchema = z.object({
  plan: z.enum(['PRO', 'BUSINESS']),
})

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
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })
  if (!user.stripeSubscriptionId) {
    return NextResponse.json({ error: 'Aucun abonnement actif.' }, { status: 400 })
  }

  const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
  const item = subscription.items.data[0]
  if (!item) return NextResponse.json({ error: 'Abonnement invalide.' }, { status: 400 })

  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    items:              [{ id: item.id, price: PRICE_IDS[plan] }],
    proration_behavior: 'create_prorations',
    metadata:           { userId: session.user.id, plan },
  })

  return NextResponse.json({ ok: true })
}

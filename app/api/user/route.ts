import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { stripeSubscriptionId: true },
  })

  // Cancel active Stripe subscription before deleting account.
  // Without this, Stripe would keep billing a non-existent customer.
  if (user?.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(user.stripeSubscriptionId).catch((err) => {
      console.error('[user delete] stripe cancel failed:', err)
    })
  }

  // Cascade delete handles invoices and reminder logs via Prisma schema
  await prisma.user.delete({ where: { id: session.user.id } })

  return new NextResponse(null, { status: 204 })
}

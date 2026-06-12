import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { canCreateInvoice, getInvoiceLimit } from '@/lib/plan'

const createSchema = z.object({
  clientName:  z.string().min(1).max(200),
  clientEmail: z.string().email().max(254),
  amount:      z.number().positive().max(10_000_000),
  currency:    z.string().length(3).default('EUR'),
  dueDate:     z.string().datetime().refine(
    (d) => {
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      return new Date(d) >= today
    },
    { message: "La date d'échéance ne peut pas être dans le passé." }
  ),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = await prisma.invoice.findMany({
    where:   { userId: session.user.id },
    orderBy: { invoiceNumber: { sort: 'asc', nulls: 'last' } },
  })

  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { plan: true, _count: { select: { invoices: true } } },
  })
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 })

  if (!canCreateInvoice(user.plan, user._count.invoices)) {
    const limit = getInvoiceLimit(user.plan)
    return NextResponse.json(
      { error: `Limite atteinte (${limit} factures sur le plan Gratuit). Passez au plan Pro.` },
      { status: 403 },
    )
  }

  let invoice
  try {
    invoice = await prisma.$transaction(async (tx) => {
      // Advisory lock serializes concurrent invoice creation per user (invoiceNumber + limit check).
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.user.id}))`

      // Re-check limit inside the lock to prevent race condition on FREE plan.
      const currentCount = await tx.invoice.count({ where: { userId: session.user.id } })
      if (!canCreateInvoice(user.plan, currentCount)) {
        throw Object.assign(new Error('LIMIT_EXCEEDED'), { __code: 'LIMIT_EXCEEDED' })
      }

      const last = await tx.invoice.findFirst({
        where:   { userId: session.user.id },
        orderBy: { invoiceNumber: 'desc' },
        select:  { invoiceNumber: true },
      })
      const nextNumber = (last?.invoiceNumber ?? 0) + 1

      return tx.invoice.create({
        data: {
          invoiceNumber: nextNumber,
          clientName:    parsed.data.clientName,
          clientEmail:   parsed.data.clientEmail,
          amount:        parsed.data.amount,
          currency:      parsed.data.currency,
          dueDate:       new Date(parsed.data.dueDate),
          userId:        session.user.id,
        },
      })
    })
  } catch (err) {
    if ((err as { __code?: string }).__code === 'LIMIT_EXCEEDED') {
      const limit = getInvoiceLimit(user.plan)
      return NextResponse.json(
        { error: `Limite atteinte (${limit} factures sur le plan Gratuit). Passez au plan Pro.` },
        { status: 403 },
      )
    }
    throw err
  }

  logger.info({ event: 'invoice_created', userId: session.user.id, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber })

  return NextResponse.json(invoice, { status: 201 })
}

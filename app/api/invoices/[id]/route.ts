import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { InvoiceStatus } from '@prisma/client'

const updateSchema = z.object({
  // Only PAID is user-settable. OVERDUE is set by the cron. UNPAID is the initial state only.
  status:      z.literal(InvoiceStatus.PAID).optional(),
  clientName:  z.string().min(1).max(200).optional(),
  clientEmail: z.string().email().max(254).optional(),
  amount:      z.number().positive().max(10_000_000).optional(),
  dueDate:     z.string().datetime().refine(
    (d) => { const today = new Date(); today.setUTCHours(0, 0, 0, 0); return new Date(d) >= today },
    { message: "La date d'échéance ne peut pas être dans le passé." }
  ).optional(),
})

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })

  const updated = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id, userId: session.user.id } })
    if (!invoice) return null

    // Block any modification on a paid invoice
    if (invoice.status === InvoiceStatus.PAID) return null

    const paidAtUpdate =
      parsed.data.status === InvoiceStatus.PAID
        ? { paidAt: new Date() }
        : {}

    return tx.invoice.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.dueDate && { dueDate: new Date(parsed.data.dueDate) }),
        ...paidAtUpdate,
      },
    })
  })

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (parsed.data.status === InvoiceStatus.PAID) {
    logger.info({ event: 'invoice_paid', userId: session.user.id, invoiceId: id })
  }

  return NextResponse.json(updated)
}

export async function DELETE(
  _: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  const result = await prisma.invoice.deleteMany({ where: { id, userId: session.user.id } })
  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  logger.info({ event: 'invoice_deleted', userId: session.user.id, invoiceId: id })

  return new NextResponse(null, { status: 204 })
}

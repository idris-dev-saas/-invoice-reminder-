import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { InvoiceStatus } from '@prisma/client'

const updateSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
})

async function getOwnedInvoice(id: string, userId: string) {
  return prisma.invoice.findFirst({ where: { id, userId } })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const invoice = await getOwnedInvoice(id, session.user.id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.invoice.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.dueDate && { dueDate: new Date(parsed.data.dueDate) }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params
  const invoice = await getOwnedInvoice(id, session.user.id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.invoice.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}

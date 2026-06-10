import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('EUR'),
  dueDate: z.string().datetime(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const invoice = await prisma.invoice.create({
    data: {
      clientName: parsed.data.clientName,
      clientEmail: parsed.data.clientEmail,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      dueDate: new Date(parsed.data.dueDate),
      userId: session.user.id,
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Cascade delete handles invoices and reminder logs via Prisma schema
  await prisma.user.delete({ where: { id: session.user.id } })

  return new NextResponse(null, { status: 204 })
}

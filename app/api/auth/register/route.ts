import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/services/email'

const registerSchema = z.object({
  email:    z.string().email().max(254),
  password: z.string().min(8).max(128),
  name:     z.string().min(1).max(100).optional(),
})

export async function POST(req: Request) {
  // Rate limit: 5 registrations per IP per hour
  const ip      = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const allowed = await checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!allowed) {
    logger.warn({ event: 'rate_limit_hit', context: 'register', ip })
    return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une heure.' }, { status: 429 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides.' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) {
    return NextResponse.json({ error: 'Cet email est déjà utilisé.' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12)
  const user   = await prisma.user.create({
    data: {
      email:    parsed.data.email,
      password: hashed,
      name:     parsed.data.name,
    },
  })

  sendWelcomeEmail(user.email, user.name ?? undefined)

  logger.info({ event: 'user_registered', userId: user.id })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}

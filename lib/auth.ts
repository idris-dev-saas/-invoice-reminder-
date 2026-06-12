import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { checkRateLimit } from './rateLimit'
import { logger } from './logger'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email:    z.string().email().max(254),
  password: z.string().min(1).max(128),
})

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages:   { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        // Rate limit: 10 attempts per IP per 15 minutes
        const ip      = (req?.headers?.['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? 'unknown'
        const allowed = await checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
        if (!allowed) {
          logger.warn({ event: 'rate_limit_hit', context: 'login', ip })
          throw new Error('RATE_LIMITED')
        }

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
        if (!user) {
          logger.warn({ event: 'auth_failed', context: 'login', reason: 'user_not_found' })
          return null
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) {
          logger.warn({ event: 'auth_failed', context: 'login', userId: user.id })
          return null
        }

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
}

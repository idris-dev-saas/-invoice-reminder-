import { prisma } from './prisma'

/**
 * DB-based rate limiter — works across serverless instances.
 * Returns true if the request is allowed, false if limit exceeded.
 * Fails open on DB error (never blocks legitimate users due to infra issues).
 */
export async function checkRateLimit(
  key:      string,
  limit:    number,
  windowMs: number,
): Promise<boolean> {
  const now     = new Date()
  const resetAt = new Date(now.getTime() + windowMs)

  try {
    const existing = await prisma.rateLimitEntry.findUnique({ where: { id: key } })

    if (existing) {
      // Window expired — reset
      if (existing.resetAt <= now) {
        await prisma.rateLimitEntry.update({
          where: { id: key },
          data:  { count: 1, resetAt },
        })
        return true
      }

      // Within window and over limit
      if (existing.count >= limit) return false

      // Within window and under limit — increment
      await prisma.rateLimitEntry.update({
        where: { id: key },
        data:  { count: { increment: 1 } },
      })
      return true
    }

    // First hit — create entry
    await prisma.rateLimitEntry.create({ data: { id: key, count: 1, resetAt } })
    return true
  } catch {
    // Fail open — DB issues must not block users
    return true
  }
}

/** Best-effort cleanup of expired entries (call from cron, not hot paths). */
export async function purgeExpiredRateLimits(): Promise<void> {
  await prisma.rateLimitEntry.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => {})
}

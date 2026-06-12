import { logger } from '@/lib/logger'
import { purgeExpiredRateLimits } from '@/lib/rateLimit'
import { processReminders } from './reminders'

/**
 * Top-level cron orchestrator.
 * Called by the Vercel Cron endpoint — handles logging, housekeeping, errors.
 */
export async function runCron(): Promise<{ ok: boolean; marked: number; sent: number; errors: number }> {
  logger.info({ event: 'cron_started' })

  let result = { marked: 0, sent: 0, errors: 0 }

  try {
    result = await processReminders()
  } catch (err) {
    logger.error({ event: 'cron_error', context: 'cron', error: String(err) })
    return { ok: false, ...result }
  }

  // Housekeeping — clean up expired rate limit entries
  purgeExpiredRateLimits().catch(() => {})

  logger.info({ event: 'cron_completed', ...result })

  return { ok: true, ...result }
}

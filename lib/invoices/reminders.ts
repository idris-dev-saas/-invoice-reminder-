import { prisma } from '@/lib/prisma'
import { sendReminderEmail } from '@/services/email'
import { logger } from '@/lib/logger'
import { InvoiceStatus } from '@prisma/client'
import { markOverdueInvoices } from './status'
import { canUseReminder, type ReminderType } from './permissions'

const REMINDER_SCHEDULE: { type: ReminderType; days: number }[] = [
  { type: 'J3',  days: 3  },
  { type: 'J7',  days: 7  },
  { type: 'J14', days: 14 },
]

export interface ReminderResult {
  marked: number
  sent:   number
  errors: number
}

export async function processReminders(): Promise<ReminderResult> {
  const now    = new Date()
  const marked = await markOverdueInvoices()

  const invoices = await prisma.invoice.findMany({
    where:   { status: InvoiceStatus.OVERDUE },
    include: {
      user:      { select: { email: true, plan: true } },
      reminders: true,
    },
  })

  let sent   = 0
  let errors = 0

  for (const invoice of invoices) {
    const daysOverdue = Math.floor(
      (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24),
    )

    for (const { type, days } of REMINDER_SCHEDULE) {
      if (daysOverdue < days) continue
      if (!canUseReminder(invoice.user.plan, type)) continue

      const alreadySent = invoice.reminders.some((r) => r.reminderType === type)
      if (alreadySent) continue

      // Claim the send slot BEFORE sending the email.
      // This prevents duplicate emails when two cron instances run concurrently:
      // only one will win the unique constraint; the other will skip.
      try {
        await prisma.reminderLog.create({
          data: { invoiceId: invoice.id, reminderType: type },
        })
      } catch (e: unknown) {
        const code = (e as { code?: string }).code
        if (code === 'P2002') continue  // Already claimed by another instance
        throw e
      }

      // Send email — if it fails, release the claim so next cron can retry
      const ok = await sendReminderEmail(
        {
          clientName:  invoice.clientName,
          clientEmail: invoice.clientEmail,
          amount:      invoice.amount,
          currency:    invoice.currency,
          dueDate:     invoice.dueDate,
          invoiceId:   invoice.id,
          ownerEmail:  invoice.user.email,
        },
        type,
      )

      if (ok) {
        logger.info({ event: 'email_sent', invoiceId: invoice.id, reminderType: type })
        sent++
      } else {
        // Release the claim — next cron run will retry
        await prisma.reminderLog
          .delete({
            where: { invoiceId_reminderType: { invoiceId: invoice.id, reminderType: type } },
          })
          .catch(() => {})
        logger.error({ event: 'email_failed', invoiceId: invoice.id, reminderType: type })
        errors++
      }
    }
  }

  return { marked, sent, errors }
}

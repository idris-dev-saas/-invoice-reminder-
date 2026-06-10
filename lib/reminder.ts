import { prisma } from './prisma'
import { sendReminderEmail } from '@/services/email'
import { InvoiceStatus } from '@prisma/client'

type ReminderType = 'J3' | 'J7' | 'J14'

const REMINDER_DAYS: { type: ReminderType; days: number }[] = [
  { type: 'J3', days: 3 },
  { type: 'J7', days: 7 },
  { type: 'J14', days: 14 },
]

export async function processReminders(): Promise<{ sent: number; errors: number }> {
  const now = new Date()
  let sent = 0
  let errors = 0

  await prisma.invoice.updateMany({
    where: {
      status: InvoiceStatus.UNPAID,
      dueDate: { lt: now },
    },
    data: { status: InvoiceStatus.OVERDUE },
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] },
    },
    include: {
      user: { select: { email: true } },
      reminders: true,
    },
  })

  for (const invoice of invoices) {
    const daysOverdue = Math.floor(
      (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    for (const { type, days } of REMINDER_DAYS) {
      if (daysOverdue < days) continue

      const alreadySent = invoice.reminders.some((r) => r.reminderType === type)
      if (alreadySent) continue

      const success = await sendReminderEmail(
        {
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          amount: invoice.amount,
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          invoiceId: invoice.id,
          ownerEmail: invoice.user.email,
        },
        type
      )

      if (success) {
        await prisma.reminderLog.create({
          data: { invoiceId: invoice.id, reminderType: type },
        })
        sent++
      } else {
        errors++
      }
    }
  }

  return { sent, errors }
}

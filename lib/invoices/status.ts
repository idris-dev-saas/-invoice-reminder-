import { prisma } from '@/lib/prisma'
import { InvoiceStatus } from '@prisma/client'

/**
 * Marks all UNPAID invoices past their due date as OVERDUE.
 * Safe to call multiple times — idempotent.
 */
export async function markOverdueInvoices(): Promise<number> {
  const result = await prisma.invoice.updateMany({
    where: {
      status:  InvoiceStatus.UNPAID,
      dueDate: { lt: new Date() },
    },
    data: { status: InvoiceStatus.OVERDUE },
  })
  return result.count
}

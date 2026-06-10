import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { InvoiceList } from '@/components/InvoiceList'
import { SignOutButton } from '@/components/SignOutButton'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Invoice Reminder</h1>
          <SignOutButton />
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Mes factures</h2>
          {overdueCount > 0 && (
            <p className="text-red-600 text-sm mt-1">
              {overdueCount} facture{overdueCount > 1 ? 's' : ''} en retard
            </p>
          )}
        </div>
        <InvoiceList invoices={invoices} />
      </div>
    </main>
  )
}


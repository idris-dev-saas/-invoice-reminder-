import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { InvoiceList } from '@/components/InvoiceList'
import { SignOutButton } from '@/components/SignOutButton'
import { PlanBanner } from '@/components/PlanBanner'
import { AnalyticsStrip } from '@/components/AnalyticsStrip'
import { canExportPdf } from '@/lib/plan'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const [invoices, user] = await Promise.all([
    prisma.invoice.findMany({
      where:   { userId: session.user.id },
      orderBy: { invoiceNumber: { sort: 'asc', nulls: 'last' } },
      include: { reminders: { orderBy: { sentAt: 'asc' } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, _count: { select: { invoices: true } } },
    }),
  ])

  return (
    <>
      <header className="app-header">
        <div className="content-wrap">
          <div className="app-logo">
            <span className="app-logo-dot" />
            Invoice Reminder
          </div>
          <nav className="header-nav">
            <a href="/dashboard" className="header-link is-active">Factures</a>
            <a href="/dashboard/billing" className="header-link">Abonnement</a>
          </nav>
          <SignOutButton />
        </div>
      </header>
      {user && (
        <PlanBanner plan={user.plan} invoiceCount={user._count.invoices} />
      )}
      <main className="dashboard-main">
        <div className="content-wrap">
          <AnalyticsStrip invoices={invoices} />
          <InvoiceList
            invoices={invoices}
            canPdf={user ? canExportPdf(user.plan) : false}
            plan={user?.plan}
          />
        </div>
      </main>
    </>
  )
}

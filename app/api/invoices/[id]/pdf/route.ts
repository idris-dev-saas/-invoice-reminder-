import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canExportPdf } from '@/lib/plan'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (!canExportPdf(user.plan)) {
    return NextResponse.json(
      { error: 'Export PDF disponible sur le plan Pro.' },
      { status: 403 }
    )
  }

  const { id } = await ctx.params
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId: session.user.id },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ref = invoice.invoiceNumber != null
    ? `INV-${String(invoice.invoiceNumber).padStart(4, '0')}`
    : invoice.id.slice(-8).toUpperCase()

  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: invoice.currency,
  }).format(invoice.amount)

  const formattedDue     = new Date(invoice.dueDate).toLocaleDateString('fr-FR')
  const formattedCreated = new Date(invoice.createdAt).toLocaleDateString('fr-FR')
  const formattedPaidAt  = invoice.paidAt
    ? new Date(invoice.paidAt).toLocaleDateString('fr-FR')
    : null

  const statusLabel: Record<string, string> = {
    PAID: 'Payée', UNPAID: 'En attente', OVERDUE: 'En retard',
  }

  // Build PDF
  const doc  = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const fontBold    = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)

  const black  = rgb(0.11, 0.11, 0.14)
  const grey   = rgb(0.40, 0.40, 0.45)
  const accent = rgb(0.17, 0.30, 0.78)
  const line   = rgb(0.87, 0.87, 0.88)

  // Header
  page.drawText('Invoice Reminder', { x: 48, y: height - 60, size: 18, font: fontBold, color: accent })
  page.drawText(`Facture ${ref}`, { x: 48, y: height - 84, size: 11, font: fontRegular, color: grey })

  // Separator
  page.drawLine({ start: { x: 48, y: height - 100 }, end: { x: width - 48, y: height - 100 }, thickness: 1, color: line })

  // Meta grid
  const meta: [string, string][] = [
    ['Date d\'émission', formattedCreated],
    ['Date d\'échéance', formattedDue],
    ['Statut',           statusLabel[invoice.status] ?? invoice.status],
  ]
  if (formattedPaidAt) {
    meta.push(['Date de paiement', formattedPaidAt])
  }
  meta.forEach(([label, value], i) => {
    const y = height - 130 - i * 22
    page.drawText(label, { x: 48, y, size: 9, font: fontRegular, color: grey })
    page.drawText(value, { x: 200, y, size: 9, font: fontBold, color: black })
  })

  // Client section
  page.drawText('Destinataire', { x: 48, y: height - 230, size: 9, font: fontRegular, color: grey })
  page.drawText(invoice.clientName,  { x: 48, y: height - 248, size: 11, font: fontBold, color: black })
  page.drawText(invoice.clientEmail, { x: 48, y: height - 264, size: 10, font: fontRegular, color: grey })

  // Amount block
  page.drawRectangle({ x: 48, y: height - 370, width: width - 96, height: 80, color: rgb(0.96, 0.97, 1.0) })
  page.drawText('Montant total dû', { x: 64, y: height - 328, size: 10, font: fontRegular, color: grey })
  page.drawText(formattedAmount, { x: 64, y: height - 350, size: 22, font: fontBold, color: accent })

  // Footer
  page.drawLine({ start: { x: 48, y: 60 }, end: { x: width - 48, y: 60 }, thickness: 1, color: line })
  page.drawText('Généré par Invoice Reminder', { x: 48, y: 44, size: 8, font: fontRegular, color: grey })

  const pdfBytes = await doc.save()

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${ref}.pdf"`,
    },
  })
}

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type ReminderType = 'J3' | 'J7' | 'J14'

interface InvoiceEmailData {
  clientName: string
  clientEmail: string
  amount: number
  currency: string
  dueDate: Date
  invoiceId: string
  ownerEmail: string
}

const subjectMap: Record<ReminderType, string> = {
  J3: 'Rappel : facture à régler',
  J7: 'Rappel urgent : facture impayée',
  J14: 'Dernier rappel : facture en souffrance',
}

function buildEmailHtml(data: InvoiceEmailData, type: ReminderType): string {
  const daysOverdue = type === 'J3' ? 3 : type === 'J7' ? 7 : 14
  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: data.currency,
  }).format(data.amount)
  const formattedDate = data.dueDate.toLocaleDateString('fr-FR')

  const urgencyNote =
    type === 'J14'
      ? `<p style="color:#dc2626;font-weight:bold;">Sans règlement de votre part dans les 48h, nous nous verrons dans l'obligation de prendre des mesures supplémentaires.</p>`
      : ''

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1e293b;">Rappel de paiement</h2>
      <p>Bonjour <strong>${data.clientName}</strong>,</p>
      <p>Nous vous contactons car la facture ci-dessous est restée impayée depuis ${daysOverdue} jours.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:24px 0;">
        <p><strong>Référence :</strong> ${data.invoiceId}</p>
        <p><strong>Montant dû :</strong> ${formattedAmount}</p>
        <p><strong>Date d'échéance :</strong> ${formattedDate}</p>
      </div>
      ${urgencyNote}
      <p>Merci de bien vouloir procéder au règlement dans les meilleurs délais.</p>
      <p>Pour toute question, n'hésitez pas à nous contacter.</p>
      <p style="color:#64748b;font-size:14px;">Cordialement</p>
    </div>
  `
}

export async function sendReminderEmail(
  data: InvoiceEmailData,
  type: ReminderType
): Promise<boolean> {
  try {
    await resend.emails.send({
      from: 'Invoice Reminder <noreply@yourdomain.com>',
      to: data.clientEmail,
      replyTo: data.ownerEmail,
      subject: subjectMap[type],
      html: buildEmailHtml(data, type),
    })
    return true
  } catch (error) {
    console.error('Failed to send reminder email:', error)
    return false
  }
}

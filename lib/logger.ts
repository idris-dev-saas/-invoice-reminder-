type Level = 'info' | 'warn' | 'error'

export type LogEvent =
  | 'user_registered'
  | 'invoice_created'
  | 'invoice_paid'
  | 'invoice_deleted'
  | 'email_sent'
  | 'email_failed'
  | 'stripe_webhook_received'
  | 'stripe_webhook_processed'
  | 'stripe_webhook_skipped'
  | 'stripe_webhook_error'
  | 'rate_limit_hit'
  | 'auth_failed'
  | 'cron_started'
  | 'cron_completed'
  | 'cron_error'
  | 'plan_upgraded'
  | 'upgrade_failed'

interface Payload {
  event:      LogEvent
  userId?:    string
  invoiceId?: string
  [key: string]: unknown
}

function emit(level: Level, payload: Payload) {
  const entry = { ts: new Date().toISOString(), level, ...payload }
  const line  = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info:  (p: Payload) => emit('info',  p),
  warn:  (p: Payload) => emit('warn',  p),
  error: (p: Payload) => emit('error', p),
}

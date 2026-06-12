import { NextResponse } from 'next/server'
import { runCron } from '@/lib/invoices/cronRunner'

function isAuthorized(req: Request): boolean {
  return req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
}

// Vercel Cron Jobs call GET
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runCron()
  return NextResponse.json(result)
}

// Manual trigger for local testing
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runCron()
  return NextResponse.json(result)
}

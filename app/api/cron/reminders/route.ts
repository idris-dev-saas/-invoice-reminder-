import { NextResponse } from 'next/server'
import { processReminders } from '@/lib/reminder'

export async function POST(req: Request) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await processReminders()
  return NextResponse.json({ ok: true, ...result })
}

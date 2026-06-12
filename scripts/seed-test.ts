/**
 * Test seed — creates 3 users with 3 invoices each to validate
 * the full reminder pipeline (J3/J7/J14, plan gating, anti-duplicate).
 *
 * Run: npx tsx scripts/seed-test.ts
 */

import 'dotenv/config'
import { InvoiceStatus, Plan } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'

const CLIENT_EMAIL = 'idrisel5002@gmail.com'
const PASSWORD     = 'Test1234!'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  console.log('\n╔══════════════════════════════════════╗')
  console.log('║       Invoice Reminder — Test Seed   ║')
  console.log('╚══════════════════════════════════════╝\n')

  const hash = await bcrypt.hash(PASSWORD, 10)

  // ── Clean previous test data ────────────────────────────────────
  await prisma.user.deleteMany({
    where: { email: { in: ['test-free@ivtest.com', 'test-pro@ivtest.com', 'test-biz@ivtest.com'] } },
  })
  console.log('✓ Previous test data cleaned')

  // ── USER 1 — FREE plan ──────────────────────────────────────────
  // Goal: verify J3 sends, J7/J14 blocked by plan
  const user1 = await prisma.user.create({
    data: {
      email:    'test-free@ivtest.com',
      password: hash,
      name:     'Test FREE',
      plan:     Plan.FREE,
    },
  })

  await prisma.invoice.createMany({
    data: [
      {
        userId:        user1.id,
        invoiceNumber: 1,
        clientName:    'Client FREE J3',
        clientEmail:   CLIENT_EMAIL,
        amount:        500,
        currency:      'EUR',
        dueDate:       daysAgo(3),
        status:        InvoiceStatus.OVERDUE,  // already overdue
      },
      {
        userId:        user1.id,
        invoiceNumber: 2,
        clientName:    'Client FREE J7',
        clientEmail:   CLIENT_EMAIL,
        amount:        1200,
        currency:      'EUR',
        dueDate:       daysAgo(7),
        status:        InvoiceStatus.UNPAID,   // markOverdue will flip this
      },
      {
        userId:        user1.id,
        invoiceNumber: 3,
        clientName:    'Client FREE J14',
        clientEmail:   CLIENT_EMAIL,
        amount:        3400,
        currency:      'EUR',
        dueDate:       daysAgo(14),
        status:        InvoiceStatus.UNPAID,
      },
    ],
  })
  console.log('✓ User 1 (FREE) created — 3 invoices (J3/J7/J14 overdue)')
  console.log('  Expected: only J3 sent per invoice (J7/J14 blocked by FREE plan)\n')

  // ── USER 2 — PRO plan ───────────────────────────────────────────
  // Goal: full cascade + PAID invoice gets no reminders
  const user2 = await prisma.user.create({
    data: {
      email:    'test-pro@ivtest.com',
      password: hash,
      name:     'Test PRO',
      plan:     Plan.PRO,
    },
  })

  const [inv2A, inv2B, inv2C] = await Promise.all([
    prisma.invoice.create({
      data: {
        userId:        user2.id,
        invoiceNumber: 1,
        clientName:    'Client PRO J3',
        clientEmail:   CLIENT_EMAIL,
        amount:        800,
        currency:      'EUR',
        dueDate:       daysAgo(3),
        status:        InvoiceStatus.OVERDUE,
      },
    }),
    prisma.invoice.create({
      data: {
        userId:        user2.id,
        invoiceNumber: 2,
        clientName:    'Client PRO PAID',
        clientEmail:   CLIENT_EMAIL,
        amount:        2500,
        currency:      'EUR',
        dueDate:       daysAgo(7),
        status:        InvoiceStatus.PAID,   // ← already paid, zero emails expected
        paidAt:        new Date(),
      },
    }),
    prisma.invoice.create({
      data: {
        userId:        user2.id,
        invoiceNumber: 3,
        clientName:    'Client PRO J14',
        clientEmail:   CLIENT_EMAIL,
        amount:        5600,
        currency:      'EUR',
        dueDate:       daysAgo(14),
        status:        InvoiceStatus.OVERDUE,
      },
    }),
  ])
  console.log('✓ User 2 (PRO) created — 3 invoices')
  console.log(`  inv2A (${inv2A.id.slice(-6)}) — J3 overdue → expect J3`)
  console.log(`  inv2B (${inv2B.id.slice(-6)}) — PAID       → expect 0 emails`)
  console.log(`  inv2C (${inv2C.id.slice(-6)}) — J14 overdue → expect J3+J7+J14\n`)

  // ── USER 3 — BUSINESS plan — edge cases ────────────────────────
  const user3 = await prisma.user.create({
    data: {
      email:    'test-biz@ivtest.com',
      password: hash,
      name:     'Test BUSINESS',
      plan:     Plan.BUSINESS,
    },
  })

  await prisma.invoice.createMany({
    data: [
      {
        userId:        user3.id,
        invoiceNumber: 1,
        clientName:    'Client BIZ Full',
        clientEmail:   CLIENT_EMAIL,
        amount:        9900,
        currency:      'EUR',
        dueDate:       daysAgo(14),
        status:        InvoiceStatus.OVERDUE,   // J3+J7+J14 all eligible
      },
      {
        userId:        user3.id,
        invoiceNumber: 2,
        clientName:    'Client BIZ Recent',
        clientEmail:   CLIENT_EMAIL,
        amount:        400,
        currency:      'EUR',
        dueDate:       daysAgo(1),
        status:        InvoiceStatus.UNPAID,    // 1 day overdue → only J3
      },
      {
        userId:        user3.id,
        invoiceNumber: 3,
        clientName:    'Client BIZ Bad Email',
        clientEmail:   'not-an-email',          // ← invalid email, tests failure path
        amount:        700,
        currency:      'EUR',
        dueDate:       daysAgo(3),
        status:        InvoiceStatus.OVERDUE,   // will attempt, Resend will fail → email_failed log
      },
    ],
  })
  console.log('✓ User 3 (BUSINESS) created — 3 invoices')
  console.log('  inv3A — J14 overdue → expect J3+J7+J14')
  console.log('  inv3B — 1 day overdue → expect J3 only (<7 days)')
  console.log('  inv3C — invalid email → expect email_failed log (safe fail)\n')

  // ── Summary ─────────────────────────────────────────────────────
  const total = await prisma.invoice.count({
    where: { userId: { in: [user1.id, user2.id, user3.id] } },
  })

  console.log('╔══════════════════════════════════════╗')
  console.log('║           Seed Complete              ║')
  console.log('╠══════════════════════════════════════╣')
  console.log(`║  Users created  : 3                  ║`)
  console.log(`║  Invoices total : ${total}                  ║`)
  console.log(`║  Client email   : ${CLIENT_EMAIL.slice(0, 22)}  ║`)
  console.log('╠══════════════════════════════════════╣')
  console.log('║  Expected after 1 cron run:          ║')
  console.log('║  FREE  → 3 emails (J3 × 3)           ║')
  console.log('║  PRO   → 4 emails (J3×2, J7+J14)     ║')
  console.log('║  BIZ   → 4 emails + 1 fail           ║')
  console.log('║  PAID  → 0 emails                    ║')
  console.log('╚══════════════════════════════════════╝\n')

  console.log('Next step: bash scripts/test-cron.sh\n')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

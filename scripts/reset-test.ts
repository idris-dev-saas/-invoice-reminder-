/**
 * Resets all test data created by seed-test.ts.
 * Also clears ReminderLogs for test invoices so cron can be re-run cleanly.
 *
 * Run: npx tsx scripts/reset-test.ts
 */

import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const deleted = await prisma.user.deleteMany({
    where: {
      email: { in: ['test-free@ivtest.com', 'test-pro@ivtest.com', 'test-biz@ivtest.com'] },
    },
  })
  // Cascade deletes invoices and reminderLogs automatically (onDelete: Cascade)
  console.log(`✓ Deleted ${deleted.count} test user(s) + all related data`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())

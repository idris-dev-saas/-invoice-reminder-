import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Crée un utilisateur de test
  const hashed = await bcrypt.hash('password123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@invoice.com' },
    update: {},
    create: {
      email: 'demo@invoice.com',
      password: hashed,
      name: 'Demo User',
    },
  })

  // Supprime les anciennes factures du user demo
  await prisma.invoice.deleteMany({ where: { userId: user.id } })

  // Crée des factures de test
  await prisma.invoice.createMany({
    data: [
      {
        userId: user.id,
        clientName: 'Acme Corp',
        clientEmail: 'acme@acme.com',
        amount: 3500,
        currency: 'EUR',
        dueDate: new Date('2026-05-01'),
        status: 'OVERDUE',
      },
      {
        userId: user.id,
        clientName: 'Studio Pixel',
        clientEmail: 'contact@studiopixel.fr',
        amount: 1200,
        currency: 'EUR',
        dueDate: new Date('2026-05-15'),
        status: 'OVERDUE',
      },
      {
        userId: user.id,
        clientName: 'Dev Freelance SARL',
        clientEmail: 'hello@devfreelance.fr',
        amount: 800,
        currency: 'EUR',
        dueDate: new Date('2026-06-30'),
        status: 'UNPAID',
      },
      {
        userId: user.id,
        clientName: 'Marie Dupont',
        clientEmail: 'marie.dupont@gmail.com',
        amount: 450,
        currency: 'EUR',
        dueDate: new Date('2026-04-01'),
        status: 'PAID',
      },
    ],
  })

  console.log('✓ Seed terminé')
  console.log('  Email    : demo@invoice.com')
  console.log('  Password : password123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

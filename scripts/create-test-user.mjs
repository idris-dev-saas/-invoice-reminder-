import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'

config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const hash = await bcrypt.hash('test1234', 12)

const user = await prisma.user.upsert({
  where:  { email: 'test@business.com' },
  update: { plan: 'BUSINESS', password: hash, name: 'Test Business' },
  create: {
    email:    'test@business.com',
    name:     'Test Business',
    password: hash,
    plan:     'BUSINESS',
  },
})

console.log('Utilisateur créé/mis à jour :')
console.log('  ID   :', user.id)
console.log('  Email:', user.email)
console.log('  Plan :', user.plan)
console.log('  Mdp  : test1234')

await prisma.$disconnect()

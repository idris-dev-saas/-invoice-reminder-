# Invoice Reminder SaaS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready MVP SaaS for automated invoice reminder emails for freelancers and small businesses.

**Architecture:** Next.js App Router monolith with API routes as backend, Prisma + PostgreSQL (Supabase), NextAuth credentials auth, Resend for emails, Vercel cron for automation.

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL (Supabase), NextAuth, Resend, Zod, bcryptjs, Vercel

---

## File Map

```
~/invoice_reminder/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   └── invoices/
│   │       ├── page.tsx
│   │       └── new/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── register/route.ts
│   │   ├── invoices/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── cron/
│   │       └── reminders/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts          ← NextAuth config
│   ├── prisma.ts        ← Prisma client singleton
│   └── reminder.ts      ← Core reminder logic
├── services/
│   └── email.ts         ← Resend email service
├── components/
│   ├── InvoiceList.tsx
│   ├── InvoiceForm.tsx
│   └── StatusBadge.tsx
├── prisma/
│   └── schema.prisma
├── middleware.ts         ← Route protection
├── .env                 ← Real secrets (gitignored)
├── .env.example         ← Template (committed)
└── vercel.json          ← Cron config
```

---

### Task 1: Project Setup & Dependencies

**Files:**
- Create: `package.json` (via create-next-app)
- Create: `.env.example`
- Create: `.env`
- Create: `vercel.json`

- [ ] **Step 1: Bootstrap Next.js app**

```bash
cd ~
npx create-next-app@latest invoice_reminder --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --use-npm
cd invoice_reminder
```

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client next-auth bcryptjs resend zod
npm install -D @types/bcryptjs
```

- [ ] **Step 3: Create .env.example**

```bash
cat > .env.example << 'EOF'
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/dbname"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_your_key_here"
CRON_SECRET="your-cron-secret-here"
EOF
```

- [ ] **Step 4: Create .env (real values — gitignored)**

```bash
cp .env.example .env
```

Edit `.env` with real Supabase credentials and keys.

- [ ] **Step 5: Ensure .env is gitignored**

```bash
echo ".env" >> .gitignore
```

- [ ] **Step 6: Create vercel.json**

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: project setup with dependencies"
```

---

### Task 2: Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Init Prisma**

```bash
npx prisma init
```

- [ ] **Step 2: Write schema**

Replace `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  name      String?
  createdAt DateTime  @default(now())
  invoices  Invoice[]
}

enum InvoiceStatus {
  UNPAID
  OVERDUE
  PAID
}

model Invoice {
  id          String        @id @default(cuid())
  userId      String
  clientName  String
  clientEmail String
  amount      Float
  currency    String        @default("EUR")
  dueDate     DateTime
  status      InvoiceStatus @default(UNPAID)
  createdAt   DateTime      @default(now())
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminders   ReminderLog[]
}

model ReminderLog {
  id           String   @id @default(cuid())
  invoiceId    String
  reminderType String   // "J3", "J7", "J14"
  sentAt       DateTime @default(now())
  invoice      Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  @@unique([invoiceId, reminderType])
}
```

- [ ] **Step 3: Run migration**

```bash
npx prisma migrate dev --name init
```

- [ ] **Step 4: Generate client**

```bash
npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/
git commit -m "feat: prisma schema with User, Invoice, ReminderLog"
```

---

### Task 3: Prisma Client Singleton

**Files:**
- Create: `lib/prisma.ts`

- [ ] **Step 1: Create singleton**

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Commit**

```bash
git add lib/prisma.ts
git commit -m "feat: prisma client singleton"
```

---

### Task 4: Authentication (NextAuth + Register)

**Files:**
- Create: `lib/auth.ts`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `app/api/auth/register/route.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create NextAuth config**

```typescript
// lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
  },
}
```

- [ ] **Step 2: Create NextAuth route**

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 3: Create register route**

```typescript
// app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(parsed.data.password, 12)
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password: hashed,
      name: parsed.data.name,
    },
  })

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
}
```

- [ ] **Step 4: Create middleware (protect /dashboard)**

```typescript
// middleware.ts
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

- [ ] **Step 5: Add types for session**

```typescript
// types/next-auth.d.ts
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string; name?: string | null }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts app/api/auth/ middleware.ts types/
git commit -m "feat: nextauth credentials auth + register route"
```

---

### Task 5: Invoice API Routes

**Files:**
- Create: `app/api/invoices/route.ts`
- Create: `app/api/invoices/[id]/route.ts`

- [ ] **Step 1: Create invoices list + create route**

```typescript
// app/api/invoices/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('EUR'),
  dueDate: z.string().datetime(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const invoice = await prisma.invoice.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
      userId: session.user.id,
    },
  })

  return NextResponse.json(invoice, { status: 201 })
}
```

- [ ] **Step 2: Create invoice update + delete route**

```typescript
// app/api/invoices/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { InvoiceStatus } from '@prisma/client'

const updateSchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
})

async function getOwnedInvoice(id: string, userId: string) {
  return prisma.invoice.findFirst({ where: { id, userId } })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoice = await getOwnedInvoice(params.id, session.user.id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      ...(parsed.data.dueDate && { dueDate: new Date(parsed.data.dueDate) }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const invoice = await getOwnedInvoice(params.id, session.user.id)
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.invoice.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/invoices/
git commit -m "feat: invoice CRUD API routes with user isolation"
```

---

### Task 6: Email Service (Resend)

**Files:**
- Create: `services/email.ts`

- [ ] **Step 1: Create email service**

```typescript
// services/email.ts
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
      ? '<p style="color:#dc2626;font-weight:bold;">Sans règlement de votre part dans les 48h, nous nous verrons dans l\'obligation de prendre des mesures supplémentaires.</p>'
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
```

- [ ] **Step 2: Commit**

```bash
git add services/email.ts
git commit -m "feat: resend email service with 3 reminder templates"
```

---

### Task 7: Reminder Logic (Cron)

**Files:**
- Create: `lib/reminder.ts`
- Create: `app/api/cron/reminders/route.ts`

- [ ] **Step 1: Create reminder logic**

```typescript
// lib/reminder.ts
import { prisma } from './prisma'
import { sendReminderEmail } from '@/services/email'
import { InvoiceStatus } from '@prisma/client'

type ReminderType = 'J3' | 'J7' | 'J14'

const REMINDER_DAYS: { type: ReminderType; days: number }[] = [
  { type: 'J3', days: 3 },
  { type: 'J7', days: 7 },
  { type: 'J14', days: 14 },
]

export async function processReminders(): Promise<{ sent: number; errors: number }> {
  const now = new Date()
  let sent = 0
  let errors = 0

  // Mark overdue: UNPAID invoices past due date
  await prisma.invoice.updateMany({
    where: {
      status: InvoiceStatus.UNPAID,
      dueDate: { lt: now },
    },
    data: { status: InvoiceStatus.OVERDUE },
  })

  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] },
    },
    include: {
      user: { select: { email: true } },
      reminders: true,
    },
  })

  for (const invoice of invoices) {
    const daysOverdue = Math.floor(
      (now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    for (const { type, days } of REMINDER_DAYS) {
      if (daysOverdue < days) continue

      const alreadySent = invoice.reminders.some((r) => r.reminderType === type)
      if (alreadySent) continue

      const success = await sendReminderEmail(
        {
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          amount: invoice.amount,
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          invoiceId: invoice.id,
          ownerEmail: invoice.user.email,
        },
        type
      )

      if (success) {
        await prisma.reminderLog.create({
          data: { invoiceId: invoice.id, reminderType: type },
        })
        sent++
      } else {
        errors++
      }
    }
  }

  return { sent, errors }
}
```

- [ ] **Step 2: Create cron API route**

```typescript
// app/api/cron/reminders/route.ts
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
```

- [ ] **Step 3: Commit**

```bash
git add lib/reminder.ts app/api/cron/
git commit -m "feat: reminder logic + cron route with anti-spam via ReminderLog"
```

---

### Task 8: UI Pages

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/register/page.tsx`
- Create: `app/dashboard/page.tsx`
- Create: `components/InvoiceList.tsx`
- Create: `components/InvoiceForm.tsx`
- Create: `components/StatusBadge.tsx`

- [ ] **Step 1: Root layout with SessionProvider**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Invoice Reminder',
  description: 'Automated invoice reminder SaaS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create Providers (SessionProvider)**

```typescript
// app/providers.tsx
'use client'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 3: Landing page**

```typescript
// app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="text-center max-w-lg px-4">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Invoice Reminder</h1>
        <p className="text-slate-600 mb-8">
          Gérez vos factures et envoyez des relances automatiques à vos clients.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Se connecter
          </Link>
          <Link href="/register" className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100">
            S'inscrire
          </Link>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Login page**

```typescript
// app/(auth)/login/page.tsx
'use client'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const result = await signIn('credentials', {
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      password: (form.elements.namedItem('password') as HTMLInputElement).value,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError('Email ou mot de passe incorrect')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Connexion</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input name="password" type="password" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p className="text-sm text-slate-600 mt-4 text-center">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">S'inscrire</Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 5: Register page**

```typescript
// app/(auth)/register/page.tsx
'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: (form.elements.namedItem('name') as HTMLInputElement).value,
        email: (form.elements.namedItem('email') as HTMLInputElement).value,
        password: (form.elements.namedItem('password') as HTMLInputElement).value,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Erreur lors de l\'inscription')
    } else {
      router.push('/login')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Créer un compte</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
            <input name="name" type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input name="email" type="email" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input name="password" type="password" minLength={8} required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p className="text-sm text-slate-600 mt-4 text-center">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Se connecter</Link>
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 6: StatusBadge component**

```typescript
// components/StatusBadge.tsx
import { InvoiceStatus } from '@prisma/client'

const styles: Record<InvoiceStatus, string> = {
  PAID: 'bg-green-100 text-green-800',
  UNPAID: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
}

const labels: Record<InvoiceStatus, string> = {
  PAID: 'Payée',
  UNPAID: 'Impayée',
  OVERDUE: 'En retard',
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
```

- [ ] **Step 7: InvoiceForm component**

```typescript
// components/InvoiceForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function InvoiceForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const dueDate = new Date((form.elements.namedItem('dueDate') as HTMLInputElement).value)

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: (form.elements.namedItem('clientName') as HTMLInputElement).value,
        clientEmail: (form.elements.namedItem('clientEmail') as HTMLInputElement).value,
        amount: parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value),
        currency: (form.elements.namedItem('currency') as HTMLInputElement).value,
        dueDate: dueDate.toISOString(),
      }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Erreur lors de la création')
    } else {
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Nouvelle facture</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom du client</label>
            <input name="clientName" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email du client</label>
            <input name="clientEmail" type="email" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Montant</label>
              <input name="amount" type="number" step="0.01" min="0" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-slate-700 mb-1">Devise</label>
              <input name="currency" defaultValue="EUR" maxLength={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date d'échéance</label>
            <input name="dueDate" type="date" required className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Dashboard page**

```typescript
// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { InvoiceList } from '@/components/InvoiceList'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mes factures</h1>
            {overdueCount > 0 && (
              <p className="text-red-600 text-sm mt-1">
                {overdueCount} facture{overdueCount > 1 ? 's' : ''} en retard
              </p>
            )}
          </div>
        </div>
        <InvoiceList invoices={invoices} />
      </div>
    </main>
  )
}
```

- [ ] **Step 9: InvoiceList component**

```typescript
// components/InvoiceList.tsx
'use client'
import { Invoice, InvoiceStatus } from '@prisma/client'
import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { InvoiceForm } from './InvoiceForm'
import { useRouter } from 'next/navigation'

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  async function markAsPaid(id: string) {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: InvoiceStatus.PAID }),
    })
    router.refresh()
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Supprimer cette facture ?')) return
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Nouvelle facture
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          Aucune facture. Créez-en une !
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className={`bg-white rounded-xl border p-4 flex items-center justify-between ${
                invoice.status === 'OVERDUE' ? 'border-red-200' : 'border-slate-200'
              }`}
            >
              <div>
                <p className="font-medium text-slate-900">{invoice.clientName}</p>
                <p className="text-sm text-slate-500">{invoice.clientEmail}</p>
                <p className="text-sm text-slate-500">
                  Échéance : {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-bold text-slate-900">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: invoice.currency,
                  }).format(invoice.amount)}
                </p>
                <StatusBadge status={invoice.status} />
                {invoice.status !== 'PAID' && (
                  <button
                    onClick={() => markAsPaid(invoice.id)}
                    className="text-xs text-green-700 border border-green-300 px-2 py-1 rounded hover:bg-green-50"
                  >
                    Marquer payée
                  </button>
                )}
                <button
                  onClick={() => deleteInvoice(invoice.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && <InvoiceForm onClose={() => setShowForm(false)} />}
    </>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add app/ components/
git commit -m "feat: complete UI — dashboard, auth pages, invoice list + form"
```

---

### Task 9: RGPD — Account Deletion

**Files:**
- Create: `app/api/user/route.ts`

- [ ] **Step 1: Create delete account route**

```typescript
// app/api/user/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Cascade delete handles invoices and reminder logs via Prisma schema
  await prisma.user.delete({ where: { id: session.user.id } })

  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/user/
git commit -m "feat: RGPD account deletion with cascade"
```

---

### Task 10: Deployment Instructions

**Files:**
- Create: `DEPLOY.md`

- [ ] **Step 1: Write deployment guide**

```markdown
# Déploiement

## 1. Supabase
1. Créer un projet sur supabase.com
2. Récupérer : Settings > Database > Connection string (Transaction mode pour DATABASE_URL, Direct pour DIRECT_URL)

## 2. Resend
1. Créer un compte sur resend.com
2. Ajouter et vérifier ton domaine
3. Générer une API key
4. Dans services/email.ts, remplacer `noreply@yourdomain.com` par ton email vérifié

## 3. Variables d'environnement Vercel
Ajouter dans Vercel Dashboard > Settings > Environment Variables :
- DATABASE_URL
- DIRECT_URL
- NEXTAUTH_SECRET (générer avec : openssl rand -base64 32)
- NEXTAUTH_URL (ton URL de production ex: https://invoice-reminder.vercel.app)
- RESEND_API_KEY
- CRON_SECRET (générer avec : openssl rand -base64 32)

## 4. Déployer
git push origin main
# Vercel déploie automatiquement

## 5. Migration base de données
npx prisma migrate deploy

## 6. Cron job
vercel.json configure le cron automatiquement sur Vercel.
Le endpoint /api/cron/reminders s'exécute chaque jour à 8h UTC.
```

- [ ] **Step 2: Commit**

```bash
git add DEPLOY.md
git commit -m "docs: deployment instructions"
```

---

## Self-Review

**Spec coverage check:**
- Auth (inscription/login/logout/session) → Tasks 4 ✓
- Invoice CRUD (id, user_id, client_name, client_email, amount, currency, due_date, status) → Tasks 2, 5 ✓
- Auto reminder J+3/J+7/J+14 → Tasks 6, 7 ✓
- Dashboard with status, overdue indicators → Task 8 ✓
- Cron every 24h → Tasks 7, 10 ✓
- User isolation (user_id filter) → Tasks 4, 5 ✓
- Passwords hashed (bcrypt) → Task 4 ✓
- Zod validation → Tasks 4, 5 ✓
- Resend server-side only → Task 6 ✓
- Anti-duplicate reminders → Task 7 (ReminderLog unique constraint) ✓
- RGPD delete → Task 9 ✓
- .env.example → Task 1 ✓
- vercel.json cron → Task 1, 10 ✓

**All tasks covered. No gaps found.**

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  variable: '--font-inter',
  display:  'swap',
})

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://invoice-reminder.app'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default:  'Invoice Reminder — Relancez automatiquement vos factures impayées',
    template: '%s | Invoice Reminder',
  },

  description:
    'Arrêtez de courir après vos paiements. Invoice Reminder détecte automatiquement les retards et relance vos clients par email à J+3, J+7 et J+14.',

  keywords: [
    'relance facture automatique',
    'factures impayées',
    'invoice reminder',
    'invoice automation',
    'freelance facturation',
    'recouvrement',
    'paiement retard',
    'small business invoicing',
  ],

  authors: [{ name: 'Invoice Reminder' }],

  openGraph: {
    type:        'website',
    locale:      'fr_FR',
    url:         BASE_URL,
    siteName:    'Invoice Reminder',
    title:       'Invoice Reminder — Relancez automatiquement vos factures impayées',
    description: 'Arrêtez de courir après vos paiements. Relances automatiques J+3, J+7 et J+14 pour vos clients.',
    images: [{
      url:    '/og.png',
      width:  1200,
      height: 630,
      alt:    'Invoice Reminder — dashboard de gestion de factures',
    }],
  },

  twitter: {
    card:        'summary_large_image',
    title:       'Invoice Reminder — Relancez automatiquement vos factures impayées',
    description: 'Arrêtez de courir après vos paiements. Relances automatiques J+3, J+7, J+14.',
    images:      ['/og.png'],
  },

  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },

  alternates: {
    canonical: BASE_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <Providers>
          <div className="app-shell">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}

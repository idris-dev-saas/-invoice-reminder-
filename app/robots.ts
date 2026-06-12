import { MetadataRoute } from 'next'

const BASE = process.env.NEXTAUTH_URL ?? 'https://invoice-reminder.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow:    '/',
        disallow: ['/dashboard/', '/api/', '/dashboard/billing'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  }
}

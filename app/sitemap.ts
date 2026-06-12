import { MetadataRoute } from 'next'

const BASE = process.env.NEXTAUTH_URL ?? 'https://invoice-reminder.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 1.0 },
    { url: `${BASE}/register`,   lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.9 },
    { url: `${BASE}/login`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${BASE}/privacy`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/terms`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/legal`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.2 },
  ]
}

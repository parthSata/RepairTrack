import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://repairtrack.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/invite/',
          '/track/',
          '/dashboard',
          '/repairs',
          '/customers',
          '/devices',
          '/inventory',
          '/invoices',
          '/reports',
          '/settings',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}


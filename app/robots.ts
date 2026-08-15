import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/my-info/',
          '/pipeline/',
          '/work-report/',
          '/job-seeker/',
        ],
      },
    ],
    sitemap: 'https://jobizic.com/sitemap.xml',
  }
}

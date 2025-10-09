import { MetadataRoute } from 'next'
import { getSetting } from '@/lib/actions/setting.actions'
 
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site } = await getSetting()
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/_next/',
          '/checkout/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/checkout/',
        ],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
  }
}

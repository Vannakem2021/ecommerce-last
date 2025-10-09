import { MetadataRoute } from 'next'
import { getSetting } from '@/lib/actions/setting.actions'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  try {
    const { site } = await getSetting()
    
    return {
      name: site.name || 'BCS Electronics',
      short_name: site.name || 'BCS',
      description: site.description || 'Your premier destination for electronics',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      orientation: 'portrait-primary',
      icons: [
        {
          src: '/icons/logo.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/logo.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      categories: ['shopping', 'electronics', 'technology'],
      shortcuts: [
        {
          name: 'Search Products',
          short_name: 'Search',
          description: 'Search for products',
          url: '/search',
          icons: [{ src: '/icons/logo.png', sizes: '192x192' }],
        },
        {
          name: 'My Orders',
          short_name: 'Orders',
          description: 'View your orders',
          url: '/account/orders',
          icons: [{ src: '/icons/logo.png', sizes: '192x192' }],
        },
        {
          name: 'Cart',
          short_name: 'Cart',
          description: 'View your shopping cart',
          url: '/cart',
          icons: [{ src: '/icons/logo.png', sizes: '192x192' }],
        },
      ],
    }
  } catch (error) {
    console.error('Error generating manifest:', error)
    // Return default manifest on error
    return {
      name: 'BCS Electronics',
      short_name: 'BCS',
      description: 'Your premier destination for electronics',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#000000',
      icons: [
        {
          src: '/icons/logo.png',
          sizes: '192x192',
          type: 'image/png',
        },
      ],
    }
  }
}

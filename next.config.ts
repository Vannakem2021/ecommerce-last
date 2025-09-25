import type { NextConfig } from 'next'
import withNextIntl from 'next-intl/plugin'

const nextConfig: NextConfig = withNextIntl()({
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eefu6cdc28.ufs.sh',  // ✅ Your specific UploadThing app domain
        pathname: '/f/**',
      },
      {
        protocol: 'https',
        hostname: 'utfs.io',  // Keep for backward compatibility
        pathname: '/f/**',
      },
    ],
  },
})

export default nextConfig
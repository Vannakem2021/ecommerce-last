import Container from '@/components/shared/container'
import { getSetting } from '@/lib/actions/setting.actions'
import Link from 'next/link'
import { MapPin, Package, Phone, Heart } from 'lucide-react'
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaPinterest } from 'react-icons/fa'

export default async function TopBar({ showPhoneOnly = false }: { showPhoneOnly?: boolean }) {
  const setting = await getSetting()

  if (showPhoneOnly) {
    return (
      <>
        {setting.site?.phone && (
          <>
            <Phone className="h-3 w-3" />
            <span className="text-xs">{setting.site.phone}</span>
          </>
        )}
      </>
    )
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <Container padding="sm">
        <div className="flex items-center justify-between h-9 text-xs">
          {/* Left side - Links */}
          <div className="flex items-center gap-4">
            <Link href="/store-location" className="flex items-center gap-1 hover:text-primary transition-colors">
              <MapPin className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Store Location</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <Link href="/track-order" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Package className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Track Your Order</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            {setting.site?.phone && (
              <Link href={`tel:${setting.site.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                <Phone className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Call Us For Enquiry</span>
              </Link>
            )}
            <span className="text-gray-300 dark:text-gray-700 hidden md:inline">|</span>
            <div className="hidden md:flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              <span>Welcome to {setting.site?.name || 'Radios'}. We provides Best Electronics Item</span>
            </div>
          </div>

          {/* Right side - Date and Social Icons */}
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">{currentDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="#" className="hover:text-primary transition-colors">
                <FaFacebookF className="h-3.5 w-3.5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <FaTwitter className="h-3.5 w-3.5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <FaInstagram className="h-3.5 w-3.5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <FaYoutube className="h-3.5 w-3.5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <FaPinterest className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
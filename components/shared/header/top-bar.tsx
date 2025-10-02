import Container from '@/components/shared/container'
import { getSetting } from '@/lib/actions/setting.actions'
import Link from 'next/link'
import { MapPin, Phone, Heart } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaTiktok } from 'react-icons/fa'
import { MdOutlineDateRange } from 'react-icons/md'
import TrackOrderLink from './track-order-link'

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
            <Link href="https://www.google.com/maps/place/HSP+Khmer+Store/@11.473392,104.8686799,18z/data=!4m6!3m5!1s0x31095b637022d8cd:0x1bd5cc2c8c14ee83!8m2!3d11.4737038!4d104.8663286!16s%2Fg%2F11rr8t6n2b?entry=ttu&g_ep=EgoyMDI1MDkzMC4wIKXMDSoASAFQAw%3D%3D" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
              <MapPin className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Store Location</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <TrackOrderLink />
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <div className="hidden md:flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              <span>Welcome to {setting.site?.name || 'Radios'}. We provides Best Electronics Item</span>
            </div>
          </div>

          {/* Right side - Date and Social Icons */}
          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-1 text-xs">
              <MdOutlineDateRange className="h-3.5 w-3.5" />
              <span className="text-muted-foreground">{currentDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link href="#" className="hover:text-primary transition-colors">
                <FaFacebookF className="h-3.5 w-3.5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <FaInstagram className="h-3.5 w-3.5" />
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                <FaTiktok className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
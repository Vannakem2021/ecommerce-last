'use client'

import Link from 'next/link'
import { useAuthSession } from '@/hooks/use-auth-session'
import { usePathname, useRouter } from 'next/navigation'
import { Package } from 'lucide-react'

export default function TrackOrderLink() {
  const auth = useAuthSession()
  const pathname = usePathname()
  const router = useRouter()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!auth.isAuthenticated) {
      e.preventDefault()
      router.push(`/sign-in?callbackUrl=${encodeURIComponent('/account/orders')}`)
    }
  }

  return (
    <Link
      href="/account/orders"
      className="flex items-center gap-1 hover:text-primary transition-colors"
      onClick={handleClick}
    >
      <Package className="h-3.5 w-3.5" />
      <span className="hidden lg:inline">Track Your Order</span>
    </Link>
  )
}

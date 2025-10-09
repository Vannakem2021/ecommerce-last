'use client'
import { ChevronUp } from 'lucide-react'
import { FaFacebookF, FaInstagram, FaTiktok, FaCcVisa, FaCcMastercard } from 'react-icons/fa'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import useSettingStore from '@/hooks/use-setting-store'
import { useTranslations } from 'next-intl'
import Container from '@/components/shared/container'

export default function Footer() {
  const { setting } = useSettingStore()
  const t = useTranslations()
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <footer className='bg-black text-white underline-link relative'>
      <div className='w-full'>
        {showBackToTop && (
          <Button
            variant='ghost'
            size='lg'
            className='fixed bottom-20 right-6 bg-gray-700 hover:bg-gray-600 p-3 rounded-md z-50'
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <ChevronUp className='h-8 w-8' />
          </Button>
        )}

        <Container className='py-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Address Column */}
          <div>
            <h3 className='font-bold mb-4'>{t('Footer.Address')}</h3>
            <div className='space-y-3 text-sm'>
              {setting.site.address && (
                <div>
                  <h4 className='font-semibold mb-1'>{t('Footer.Shop')}</h4>
                  <p className='text-gray-300'>{setting.site.address}</p>
                </div>
              )}
              {setting.site.phone && (
                <div>
                  <h4 className='font-semibold mb-1'>{t('Footer.Phone')}</h4>
                  <p className='text-gray-300'>{setting.site.phone}</p>
                </div>
              )}
              {setting.site.email && (
                <div>
                  <h4 className='font-semibold mb-1'>{t('Footer.Email')}</h4>
                  <p className='text-gray-300'>{setting.site.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Support Column */}
          <div>
            <h3 className='font-bold mb-4'>{t('Footer.Supports')}</h3>
            <ul className='space-y-2'>
              <li>
                <Link href='/page/about-us' className='text-gray-300 hover:text-white transition-colors'>
                  {t('Footer.About Us')}
                </Link>
              </li>
              <li>
                <Link href='/page/contact-us' className='text-gray-300 hover:text-white transition-colors'>
                  {t('Footer.Contact Us')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us Column */}
          <div>
            <h3 className='font-bold mb-4'>{t('Footer.Follow Us')}</h3>
            <div className='space-y-4'>
              <div className='flex space-x-4'>
                <Link href='#' className='text-gray-300 hover:text-blue-500 transition-colors'>
                  <FaFacebookF className='h-6 w-6' />
                </Link>
                <Link href='#' className='text-gray-300 hover:text-pink-500 transition-colors'>
                  <FaInstagram className='h-6 w-6' />
                </Link>
                <Link href='#' className='text-gray-300 hover:text-white transition-colors'>
                  <FaTiktok className='h-6 w-6' />
                </Link>
              </div>

              <div>
                <h4 className='font-semibold mb-2'>{t('Footer.We Accept')}</h4>
                <div className='flex space-x-3 items-center'>
                  <FaCcVisa className='h-8 w-8 text-blue-600' />
                  <FaCcMastercard className='h-8 w-8 text-red-600' />
                  <Image
                    src='/icons/KHQR_Logo.png'
                    alt='KHQR'
                    width={32}
                    height={32}
                    className='object-contain'
                  />
                </div>
              </div>
            </div>
          </div>
          </div>
        </Container>
      </div>

      {/* Bottom Section */}
      <div className='border-t border-gray-800'>
        <Container className='py-4'>
          <div className='flex justify-center text-sm'>
            <p>{setting.site.copyright || '© 2025 BouchhunStore . All Rights Reserved.'}</p>
          </div>
        </Container>
      </div>
    </footer>
  )
}

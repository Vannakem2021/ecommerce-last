'use client'
import { ChevronUp, Facebook, MessageCircle, Music } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import useSettingStore from '@/hooks/use-setting-store'
import { useTranslations } from 'next-intl'
import Container from '@/components/shared/container'

export default function Footer() {
  useSettingStore()
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
              <div>
                <h4 className='font-semibold mb-1'>{t('Footer.Head Office')}</h4>
                <p className='text-gray-300'>{t('Footer.Head Office Address')}</p>
              </div>
              <div>
                <h4 className='font-semibold mb-1'>{t('Footer.Branch Office')}</h4>
                <p className='text-gray-300'>{t('Footer.Branch Office Address')}</p>
              </div>
              <div>
                <h4 className='font-semibold mb-1'>{t('Footer.Phone')}</h4>
                <p className='text-gray-300'>
                  {t('Footer.Phone Number 1')}<br />
                  {t('Footer.Phone Number 2')}
                </p>
              </div>
              <div>
                <h4 className='font-semibold mb-1'>{t('Footer.Email')}</h4>
                <p className='text-gray-300'>{t('Footer.Email Address')}</p>
              </div>
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
              <li>
                <Link href='/page/customer-service' className='text-gray-300 hover:text-white transition-colors'>
                  {t('Footer.Customer Service')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us Column */}
          <div>
            <h3 className='font-bold mb-4'>{t('Footer.Follow Us')}</h3>
            <div className='space-y-4'>
              <div className='flex space-x-4'>
                <Link href='#' className='text-gray-300 hover:text-blue-400 transition-colors'>
                  <Facebook className='h-6 w-6' />
                </Link>
                <Link href='#' className='text-gray-300 hover:text-blue-400 transition-colors'>
                  <MessageCircle className='h-6 w-6' />
                </Link>
                <Link href='#' className='text-gray-300 hover:text-pink-400 transition-colors'>
                  <Music className='h-6 w-6' />
                </Link>
              </div>

              <div>
                <h4 className='font-semibold mb-2'>{t('Footer.We Accept')}</h4>
                <div className='flex space-x-2 items-center'>
                  <div className='bg-gray-700 px-2 py-1 rounded text-xs'>Visa</div>
                  <div className='bg-gray-700 px-2 py-1 rounded text-xs'>MasterCard</div>
                  <div className='bg-gray-700 px-2 py-1 rounded text-xs'>KHQR</div>
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
            <p>© 2025 BouchhunStore . All Rights Reserved.</p>
          </div>
        </Container>
      </div>
    </footer>
  )
}

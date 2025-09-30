import { HelpCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { getSetting } from '@/lib/actions/setting.actions'
import Container from '@/components/shared/container'

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { site } = await getSetting()
  return (
    <>
      <header className='bg-card border-b'>
        <Container>
          <div className='flex justify-between items-center py-4'>
            <Link href='/'>
              <Image
                src={site.logo}
                alt={`${site.name} logo`}
                width={70}
                height={70}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Link>
            <div>
              <h1 className='text-3xl'>Checkout</h1>
            </div>
            <div>
              <Link href='/page/help'>
                <HelpCircle className='w-6 h-6' />
              </Link>
            </div>
          </div>
        </Container>
      </header>
      <Container className='py-4'>
        {children}
      </Container>
    </>
  )
}

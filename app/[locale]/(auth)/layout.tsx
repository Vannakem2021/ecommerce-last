import { getSetting } from '@/lib/actions/setting.actions'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Container from '@/components/shared/container'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { site } = await getSetting()
  return (
    <div className='flex flex-col items-center min-h-screen highlight-link  '>
      <header className='mt-8'>
        <Link href='/'>
          <Image
            src={site.logo}
            alt={`${site.name} logo`}
            width={64}
            height={64}
            priority
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </Link>
      </header>
      <Container size='default' className='flex justify-center py-4'>
        <main className='w-full max-w-sm min-w-80'>{children}</main>
      </Container>
      <footer className='flex-1 mt-8 bg-gray-800 w-full'>
        <Container className='flex flex-col gap-4 items-center py-8 text-sm'>
          <div className='flex justify-center space-x-4'>
            <Link href='/page/conditions-of-use'>Conditions of Use</Link>
            <Link href='/page/privacy-policy'> Privacy Notice</Link>
            <Link href='/page/help'> Help </Link>
          </div>
          <div>
            <p className='text-gray-400'>{site.copyright}</p>
          </div>
        </Container>
      </footer>
    </div>
  )
}

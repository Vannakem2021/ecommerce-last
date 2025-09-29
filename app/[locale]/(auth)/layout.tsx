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
    <div className='flex flex-col items-center min-h-screen bg-background'>
      <header className='py-8'>
        <Link href='/' className='block hover:opacity-80 transition-opacity'>
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
      <Container size='default' className='flex justify-center flex-1 py-4'>
        <main className='w-full max-w-sm min-w-80'>{children}</main>
      </Container>
    </div>
  )
}

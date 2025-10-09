import { getSetting } from '@/lib/actions/setting.actions'
import React from 'react'
import Container from '@/components/shared/container'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await getSetting()
  return (
    <div className='min-h-screen bg-background overflow-y-auto'>
      <Container size='default' className='flex justify-center w-full py-4 md:py-8 lg:py-12'>
        <main className='w-full flex items-center justify-center'>{children}</main>
      </Container>
    </div>
  )
}

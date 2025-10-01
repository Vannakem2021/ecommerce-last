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
    <div className='flex items-center justify-center h-screen bg-background overflow-hidden'>
      <Container size='default' className='flex justify-center w-full'>
        <main className='w-full'>{children}</main>
      </Container>
    </div>
  )
}

import React from 'react'

import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'
import Container from '@/components/shared/container'
import { ChatbotWidget } from '@/components/shared/chatbot'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className='flex flex-col min-h-screen'>
        <Header />
        <main className='flex-1 flex flex-col'>
          <Container className='flex-1 flex flex-col py-4'>
            {children}
          </Container>
        </main>
        <Footer />
      </div>
      <ChatbotWidget />
    </>
  )
}

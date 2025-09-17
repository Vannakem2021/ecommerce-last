import { Metadata } from 'next'
import CheckoutForm from './checkout-form'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Checkout',
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const session = await auth()

  // Authentication checkpoint for cart-to-order flow
  // Users can browse and add items to cart without authentication,
  // but must sign in to complete purchase
  if (!session?.user) {
    const { locale } = await params
    const callbackUrl = locale === 'en-US' ? '/checkout' : `/${locale}/checkout`
    const signInUrl = locale === 'en-US' ? '/sign-in' : `/${locale}/sign-in`
    redirect(`${signInUrl}?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return <CheckoutForm />
}

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserAddressesFromOrders } from '@/lib/actions/order.actions'
import AddressesPage from './addresses-page'

export const metadata: Metadata = {
  title: 'My Addresses',
}

export default async function AddressesPageWrapper() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const result = await getUserAddressesFromOrders(session.user.id)
  const addresses = result.data || []

  return <AddressesPage addresses={addresses} userId={session.user.id} />
}

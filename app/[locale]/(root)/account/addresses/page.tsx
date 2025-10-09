import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserAddresses } from '@/lib/actions/address.actions'
import AddressesPage from './addresses-page'

export const metadata: Metadata = {
  title: 'My Addresses',
}

export default async function AddressesPageWrapper() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const result = await getUserAddresses()
  // Data is already serialized from the server action
  const addresses = result.data || []

  return <AddressesPage addresses={addresses} />
}

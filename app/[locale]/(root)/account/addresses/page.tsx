import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUserById } from '@/lib/actions/user.actions'
import AddressesPage from './addresses-page'

export const metadata: Metadata = {
  title: 'My Addresses',
}

export default async function AddressesPageWrapper() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const user = await getUserById(session.user.id)
  if (!user) {
    redirect('/sign-in')
  }

  return <AddressesPage user={user} />
}

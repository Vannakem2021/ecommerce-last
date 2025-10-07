import { redirect } from 'next/navigation'
import { auth } from '@/auth'

export default async function AccountPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/sign-in')
  }

  // Redirect to settings since overview was redundant
  redirect('/account/manage')
}

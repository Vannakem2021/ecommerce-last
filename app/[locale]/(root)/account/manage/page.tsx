import { Metadata } from 'next'
import { auth } from '@/auth'
import { getUserAuthMethod, getUserById } from '@/lib/actions/user.actions'
import SettingsPageClient from './settings-page-client'

export const metadata: Metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return null
  }
  
  // Get full user data
  const userData = await getUserById(session.user.id)
  
  // Get user's auth method to determine if they have a password
  const authMethod = await getUserAuthMethod(session.user.id)
  const hasPassword = authMethod.data?.hasPassword || false

  return (
    <SettingsPageClient 
      user={{
        name: userData?.name || '',
        email: userData?.email || '',
        emailVerified: userData?.emailVerified || false,
        image: userData?.image,
        phone: userData?.phone,
        preferredLanguage: (userData?.preferredLanguage as 'en-US' | 'kh') || 'en-US',
        preferredCurrency: (userData?.preferredCurrency as 'USD' | 'KHR') || 'USD',
      }}
      hasPassword={hasPassword}
    />
  )
}

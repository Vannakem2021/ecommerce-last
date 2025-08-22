import { getNoCachedSetting } from '@/lib/actions/setting.actions'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import SettingForm from './setting-form'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Setting',
}

const SettingPage = async () => {
  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'settings.read')) {
    throw new Error('Insufficient permissions to view settings')
  }

  return (
    <div className='max-w-6xl mx-auto'>
      <main>
        <div className='my-8'>
          <SettingForm setting={await getNoCachedSetting()} />
        </div>
      </main>
    </div>
  )
}

export default SettingPage

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
    <div className='space-y-2'>
      <SettingForm setting={await getNoCachedSetting()} />
    </div>
  )
}

export default SettingPage

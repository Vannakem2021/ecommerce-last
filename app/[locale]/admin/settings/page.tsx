import { getNoCachedSetting } from '@/lib/actions/setting.actions'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import TabSettingsForm from './tab-settings-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Setting',
}

const SettingPage = async () => {
  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'settings.read')) {
    throw new Error('Insufficient permissions to view settings')
  }

  const setting = await getNoCachedSetting()

  return (
    <div className='space-y-2'>
      <TabSettingsForm setting={setting} />
    </div>
  )
}

export default SettingPage

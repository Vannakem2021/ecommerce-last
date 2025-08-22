import { getNoCachedSetting } from '@/lib/actions/setting.actions'
import SettingForm from './setting-form'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Setting',
}
const SettingPage = async () => {
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

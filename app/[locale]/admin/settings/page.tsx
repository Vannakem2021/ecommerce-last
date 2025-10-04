import { getNoCachedSetting } from '@/lib/actions/setting.actions'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import TabSettingsForm from './tab-settings-form'
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Settings } from 'lucide-react'

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
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
            <Link href="/admin/overview" className="flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Admin
            </Link>
          </Button>
          <span>/</span>
          <span className="text-foreground">Settings</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <Settings className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
                <p className="text-muted-foreground mt-1">
                  Configure your store settings, integrations, and preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <TabSettingsForm setting={setting} />
    </div>
  )
}

export default SettingPage

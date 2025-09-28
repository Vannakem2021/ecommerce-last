import { getNoCachedSetting } from '@/lib/actions/setting.actions'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import TabSettingsForm from './tab-settings-form'
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, Settings, Server, Shield, Palette, Database } from 'lucide-react'

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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground mt-1">
              All services running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Secure</div>
            <p className="text-xs text-muted-foreground mt-1">
              SSL & auth enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Theme</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{setting.defaultTheme || 'Light'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current theme mode
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Save</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Active</div>
            <p className="text-xs text-muted-foreground mt-1">
              Changes saved automatically
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settings Form */}
      <TabSettingsForm setting={setting} />
    </div>
  )
}

export default SettingPage

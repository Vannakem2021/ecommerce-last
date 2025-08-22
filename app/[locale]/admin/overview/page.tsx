import { Metadata } from 'next'

import OverviewReport from './overview-report'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

const DashboardPage = async () => {
  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'reports.read')) {
    throw new Error('Insufficient permissions to view dashboard')
  }

  return <OverviewReport />
}

export default DashboardPage

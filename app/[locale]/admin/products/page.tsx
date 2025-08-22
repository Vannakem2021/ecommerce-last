import { Metadata } from 'next'
import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import ProductList from './product-list'

export const metadata: Metadata = {
  title: 'Admin Products',
}

export default async function AdminProduct() {
  const session = await auth()

  if (!session?.user?.role || !hasPermission(session.user.role, 'products.read')) {
    throw new Error('Insufficient permissions to view products')
  }

  return <ProductList />
}

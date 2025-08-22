import { redirect } from 'next/navigation'

export default function AdminIndexPage() {
  // Redirect to the admin overview page
  redirect('/admin/overview')
}

import { auth } from '@/auth'
import { hasPermission } from '@/lib/rbac-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DebugSessionPage() {
  const session = await auth()

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Session Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Session Status:</h3>
              <p>{session ? '✅ Authenticated' : '❌ Not authenticated'}</p>
            </div>
            
            {session?.user && (
              <>
                <div>
                  <h3 className="font-semibold">User Information:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>ID: {session.user.id}</li>
                    <li>Name: {session.user.name}</li>
                    <li>Email: {session.user.email}</li>
                    <li>Role: {session.user.role}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold">Permissions Check:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>reports.read: {hasPermission(session.user.role, 'reports.read') ? '✅' : '❌'}</li>
                    <li>products.read: {hasPermission(session.user.role, 'products.read') ? '✅' : '❌'}</li>
                    <li>users.read: {hasPermission(session.user.role, 'users.read') ? '✅' : '❌'}</li>
                    <li>orders.read: {hasPermission(session.user.role, 'orders.read') ? '✅' : '❌'}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold">Admin Access Check:</h3>
                  <p>
                    Should have admin access: {
                      session.user.role && hasPermission(session.user.role, 'reports.read') 
                        ? '✅ YES' 
                        : '❌ NO'
                    }
                  </p>
                </div>
              </>
            )}
            
            {!session && (
              <div>
                <p>Please sign in to see session information.</p>
                <a href="/sign-in" className="text-blue-500 underline">Go to Sign In</a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotificationsTestPage() {
  const [debug, setDebug] = useState<any>(null)
  const [roleInfo, setRoleInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkNotifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications/test')
      const data = await response.json()
      setDebug(data)
      
      // Also check role
      const roleResponse = await fetch('/api/notifications/check-role')
      const roleData = await roleResponse.json()
      setRoleInfo(roleData)
      
      // Log to console for debugging
      console.log('=== YOUR ACCOUNT INFO ===')
      console.log('Your User ID:', roleData.currentUser?.id)
      console.log('Your Name:', roleData.currentUser?.name)
      console.log('Your Email:', roleData.currentUser?.email)
      console.log('Your Role:', roleData.currentUser?.role)
      console.log('Will Receive Notifications:', roleData.currentUser?.willReceiveNotifications)
      console.log('=========================')
    } catch (error) {
      console.error('Failed to check notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTestNotification = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/notifications/test', { method: 'POST' })
      const data = await response.json()
      alert('Test notification created! Check the bell icon.')
      console.log('Created:', data)
      // Refresh debug info
      await checkNotifications()
    } catch (error) {
      console.error('Failed to create test notification:', error)
      alert('Failed to create test notification')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification System Test</CardTitle>
          <CardDescription>
            Debug and test your notification system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={checkNotifications} disabled={loading}>
              {loading ? 'Loading...' : 'Check Database'}
            </Button>
            <Button onClick={createTestNotification} disabled={loading} variant="secondary">
              Create Test Notification
            </Button>
          </div>

          {debug && (
            <div className="mt-6 space-y-4">
              {roleInfo && (
                <Card className={roleInfo.currentUser?.willReceiveNotifications ? 'bg-green-50 dark:bg-green-950' : 'bg-yellow-50 dark:bg-yellow-950'}>
                  <CardHeader>
                    <CardTitle className="text-lg">Your User Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div><strong>Your User ID:</strong> <code className="bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded">{roleInfo.currentUser?.id}</code></div>
                      <div><strong>Name:</strong> {roleInfo.currentUser?.name}</div>
                      <div><strong>Email:</strong> {roleInfo.currentUser?.email}</div>
                      <div><strong>Role:</strong> <span className="font-bold text-lg">{roleInfo.currentUser?.role?.toUpperCase()}</span></div>
                      <div className="mt-3 p-3 border rounded">
                        {roleInfo.currentUser?.willReceiveNotifications ? (
                          <div className="text-green-700 dark:text-green-300 font-bold">
                            ✅ You WILL receive order/stock/user notifications (admin or manager)
                          </div>
                        ) : (
                          <div className="text-yellow-700 dark:text-yellow-300 font-bold">
                            ⚠️ You will NOT receive order/stock/user notifications<br/>
                            <span className="text-sm font-normal">Only admins and managers receive these notifications. Your role: {roleInfo.currentUser?.role}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <strong>Total Admins/Managers in System:</strong> {roleInfo.totalAdminsAndManagers}
                      </div>
                      {roleInfo.adminUsers && roleInfo.adminUsers.length > 0 && (
                        <div className="mt-3">
                          <strong>Admins/Managers Who Receive Notifications:</strong>
                          <div className="mt-2 space-y-1">
                            {roleInfo.adminUsers.map((admin: any) => (
                              <div key={admin.id} className={`p-2 border rounded text-xs ${admin.isYou ? 'bg-blue-100 dark:bg-blue-900 border-blue-500' : ''}`}>
                                <div><strong>ID:</strong> <code>{admin.id}</code> {admin.isYou && <span className="text-blue-600 font-bold">← THIS IS YOU!</span>}</div>
                                <div><strong>Name:</strong> {admin.name}</div>
                                <div><strong>Email:</strong> {admin.email}</div>
                                <div><strong>Role:</strong> {admin.role}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-sm">
                    <div>
                      <strong>Your User ID:</strong> {debug.debug?.currentUserId}
                    </div>
                    <div>
                      <strong>Your User ObjectId:</strong> {debug.debug?.currentUserObjectId}
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      Total Notifications in DB: {debug.debug?.totalNotificationsInDB || 0}
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      Notifications for You: {debug.debug?.notificationsForCurrentUser || 0}
                    </div>
                    <div>
                      <strong>String Match (wrong):</strong> {debug.debug?.notificationsWithStringMatch || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {debug.debug?.sampleNotificationUserIds?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sample Notifications in Database</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {debug.debug.sampleNotificationUserIds.map((n: any, i: number) => (
                        <div key={i} className="p-2 border rounded text-sm">
                          <div><strong>UserId:</strong> {n.userId}</div>
                          <div><strong>Type:</strong> {n.type}</div>
                          <div><strong>Title:</strong> {n.title}</div>
                          <div><strong>Created:</strong> {new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {debug.notifications?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {debug.notifications.map((n: any) => (
                        <div key={n.id} className="p-3 border rounded">
                          <div className="font-bold">{n.title}</div>
                          <div className="text-sm text-gray-600">{n.message}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString()} - {n.read ? 'Read' : 'Unread'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-lg">Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>1. Click <strong>"Check Database"</strong> to see what's in the database</div>
          <div>2. Click <strong>"Create Test Notification"</strong> to create a test notification</div>
          <div>3. Check the bell icon in the header (top right)</div>
          <div>4. The notification should appear within 30 seconds (or refresh page)</div>
        </CardContent>
      </Card>
    </div>
  )
}

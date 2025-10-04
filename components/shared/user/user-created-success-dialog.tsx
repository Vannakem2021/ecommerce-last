'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Copy, Eye, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface UserCreatedSuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  userEmail: string
  temporaryPassword: string
  userId: string
  welcomeEmailSent: boolean
}

export function UserCreatedSuccessDialog({
  open,
  onOpenChange,
  userName,
  userEmail,
  temporaryPassword,
  userId,
  welcomeEmailSent,
}: UserCreatedSuccessDialogProps) {
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)

  const copyCredentials = () => {
    const credentials = `Email: ${userEmail}\nPassword: ${temporaryPassword}`
    navigator.clipboard.writeText(credentials)
    toast({
      description: '✓ Credentials copied to clipboard',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            User Created Successfully
          </DialogTitle>
          <DialogDescription>
            Account created for <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Account Credentials */}
          <Alert>
            <AlertDescription className="space-y-3">
              <p className="text-sm font-medium">Account Credentials:</p>
              
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <code className="text-foreground font-mono">{userEmail}</code>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Password:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-foreground font-mono">
                      {showPassword ? temporaryPassword : '••••••••••••'}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={copyCredentials}
                >
                  <Copy className="h-3.5 w-3.5 mr-2" />
                  Copy Credentials
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Welcome Email Status */}
          <div className="rounded-lg border p-3">
            <div className="flex items-start gap-3">
              <div className={`p-1 rounded-full ${welcomeEmailSent ? 'bg-green-100' : 'bg-amber-100'}`}>
                <CheckCircle className={`h-4 w-4 ${welcomeEmailSent ? 'text-green-600' : 'text-amber-600'}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {welcomeEmailSent ? 'Welcome email sent' : 'No welcome email sent'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {welcomeEmailSent
                    ? `Login instructions sent to ${userEmail}`
                    : 'Make sure to save these credentials - they won\'t be shown again'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            asChild
          >
            <Link href={`/admin/users/system/${userId}/edit`}>
              <Eye className="h-4 w-4 mr-2" />
              View User
            </Link>
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => {
              onOpenChange(false)
              window.location.reload() // Refresh to create another
            }}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create Another User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

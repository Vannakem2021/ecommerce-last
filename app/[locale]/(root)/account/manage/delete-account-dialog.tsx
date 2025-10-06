'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { deleteMyAccount } from '@/lib/actions/user.actions'
import useSignOut from '@/hooks/use-sign-out'
import { AlertCircle } from 'lucide-react'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail: string
}

export function DeleteAccountDialog({ 
  open, 
  onOpenChange, 
  userEmail 
}: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const { signOut } = useSignOut()

  const canDelete = confirmText === 'DELETE'

  async function handleDelete() {
    if (!canDelete) return

    setIsDeleting(true)

    const result = await deleteMyAccount()

    if (!result.success) {
      toast({
        variant: 'destructive',
        description: result.message,
      })
      setIsDeleting(false)
      return
    }

    toast({
      description: result.message,
    })

    // Close dialog and sign out
    onOpenChange(false)
    
    // Sign out after a brief delay to show the toast
    setTimeout(() => {
      signOut({ redirectTo: '/' })
    }, 1000)
  }

  function handleCancel() {
    setConfirmText('')
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-2">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="font-semibold text-destructive text-sm">
                ⚠️ This action cannot be undone!
              </p>
            </div>
            
            <div>
              <p className="text-sm mb-2">
                This will permanently delete your account (<span className="font-medium">{userEmail}</span>) and all associated data:
              </p>
              
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Profile information</li>
                <li>Order history</li>
                <li>Saved addresses</li>
                <li>All personal data</li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">
                To confirm, type <span className="font-bold text-destructive">DELETE</span> below:
              </p>

              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                disabled={isDeleting}
                className="uppercase"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? 'Deleting Account...' : 'Delete My Account'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

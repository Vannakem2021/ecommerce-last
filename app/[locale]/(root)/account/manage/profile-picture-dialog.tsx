'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { updateProfileImage, removeProfileImage } from '@/lib/actions/user.actions'
import { UploadButton } from '@/lib/uploadthing'
import { Loader2 } from 'lucide-react'

interface ProfilePictureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentImage?: string
  userName: string
}

export function ProfilePictureDialog({ open, onOpenChange, currentImage, userName }: ProfilePictureDialogProps) {
  const router = useRouter()
  const { update } = useSession()
  const { toast } = useToast()
  const [isRemoving, setIsRemoving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  async function handleRemove() {
    setIsRemoving(true)
    
    const result = await removeProfileImage()
    
    if (!result.success) {
      toast({
        variant: 'destructive',
        description: result.message,
      })
      setIsRemoving(false)
      return
    }

    // Close dialog immediately
    onOpenChange(false)

    // Show success message
    toast({
      description: result.message,
    })

    // Update session, then force reload
    try {
      await update({ image: null })
      // Force a hard reload to clear session cache and update all components
      window.location.replace(window.location.href)
    } catch (error) {
      console.error('Failed to update session:', error)
      // Fallback reload even if session update fails
      window.location.replace(window.location.href)
    }
  }

  async function handleUploadComplete(url: string) {
    setIsUploading(true)
    
    const result = await updateProfileImage(url)
    
    if (!result.success) {
      toast({
        variant: 'destructive',
        description: result.message,
      })
      setIsUploading(false)
      return
    }

    // Close dialog immediately
    onOpenChange(false)

    // Show success message
    toast({
      description: result.message,
    })

    // Update session, then force reload
    try {
      await update({ image: url })
      // Force a hard reload to clear session cache and update all components
      window.location.replace(window.location.href)
    } catch (error) {
      console.error('Failed to update session:', error)
      // Fallback reload even if session update fails
      window.location.replace(window.location.href)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Profile Picture</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          {/* Avatar Preview */}
          <div className="flex justify-center">
            <Avatar className="w-32 h-32">
              <AvatarImage src={currentImage} alt={userName} />
              <AvatarFallback className="text-3xl">{userName?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                if (res?.[0]?.url) {
                  handleUploadComplete(res[0].url)
                }
              }}
              onUploadError={(error: Error) => {
                toast({
                  variant: 'destructive',
                  description: error.message || 'Upload failed',
                })
              }}
              appearance={{
                button: 'ut-ready:bg-primary ut-ready:hover:bg-primary/90 ut-uploading:bg-primary/50 text-sm h-10 px-4 rounded-md w-full font-medium text-primary-foreground',
                allowedContent: 'hidden'
              }}
              content={{
                button({ ready, isUploading }) {
                  if (isUploading) return 'Uploading...'
                  if (ready) return currentImage ? 'Change' : 'Upload'
                  return 'Loading...'
                }
              }}
            />

            {currentImage && (
              <Button
                variant="ghost"
                onClick={handleRemove}
                disabled={isRemoving || isUploading}
                className="flex-shrink-0"
              >
                {isRemoving ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

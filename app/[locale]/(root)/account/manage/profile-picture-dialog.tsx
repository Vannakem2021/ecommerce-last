'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { updateProfileImage, removeProfileImage } from '@/lib/actions/user.actions'
import { UploadButton } from '@/lib/uploadthing'
import { Loader2, Upload, Trash2, Camera, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfilePictureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentImage?: string
  userName: string
  hasPassword?: boolean
}

export function ProfilePictureDialog({ open, onOpenChange, currentImage, userName, hasPassword }: ProfilePictureDialogProps) {
  const router = useRouter()
  const { update } = useSession()
  const { toast } = useToast()
  const [isRemoving, setIsRemoving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  // Local state to track current image for immediate UI updates
  const [localImage, setLocalImage] = useState(currentImage)

  // Sync local state with prop when dialog opens or currentImage changes
  useEffect(() => {
    setLocalImage(currentImage)
  }, [currentImage, open])

  // Generate initials based on auth method
  // OAuth users (Google): 1 letter, Credentials users: 2 letters
  const getInitials = () => {
    if (!userName) return 'U'
    const initials = userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
    return hasPassword ? initials.slice(0, 2) : initials.slice(0, 1)
  }

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

    // Optimistically update local state for immediate UI feedback
    setLocalImage(undefined)
    setIsRemoving(false)

    // Show success message
    toast({
      description: result.message,
    })

    // Update session and refresh all server components in background
    try {
      // Update NextAuth session
      await update({ image: null })
      
      // Refresh all server components (Header, Sidebar, etc.) with new data
      router.refresh()
    } catch (error) {
      console.error('Failed to update session:', error)
      // Fallback: force full page reload if session update fails
      router.refresh()
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

    // Optimistically update local state for immediate UI feedback
    setLocalImage(url)
    setIsUploading(false)

    // Show success message
    toast({
      description: result.message,
    })

    // Update session and refresh all server components in background
    try {
      // Update NextAuth session
      await update({ image: url })
      
      // Refresh all server components (Header, Sidebar, etc.) with new data
      router.refresh()
    } catch (error) {
      console.error('Failed to update session:', error)
      // Fallback: force full page reload if session update fails
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Profile Picture</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {localImage ? 'Update or remove your photo' : 'Upload a profile photo'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
          {/* Avatar Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-2 border-border shadow-sm">
                <AvatarImage src={localImage} alt={userName} className="object-cover" />
                <AvatarFallback className="text-2xl sm:text-3xl bg-muted">{getInitials()}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
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
                  button: cn(
                    'ut-ready:bg-primary ut-ready:hover:bg-primary/90 ut-uploading:bg-primary/50',
                    'h-10 sm:h-10 px-4 rounded-md font-medium w-full shadow-sm',
                    'text-primary-foreground transition-all text-sm'
                  ),
                  container: 'w-full sm:flex-1',
                  allowedContent: 'hidden'
                }}
                content={{
                  button({ ready, isUploading }) {
                    if (isUploading) {
                      return (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Uploading...</span>
                          <span className="sm:hidden">Uploading...</span>
                        </span>
                      )
                    }
                    if (ready) {
                      return (
                        <span className="flex items-center justify-center gap-2">
                          <Upload className="h-4 w-4" />
                          {localImage ? 'Change' : 'Upload'}
                        </span>
                      )
                    }
                    return 'Loading...'
                  }
                }}
              />

              {localImage && (
                <Button
                  variant="outline"
                  onClick={handleRemove}
                  disabled={isRemoving || isUploading}
                  className="h-10 sm:h-10 px-4 w-full sm:flex-1 shadow-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-sm"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Helper Text */}
            <p className="text-xs text-center text-muted-foreground px-2">
              <span className="hidden sm:inline">Recommended: Square image, JPG or PNG (max 4MB)</span>
              <span className="sm:hidden">JPG or PNG, max 4MB</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

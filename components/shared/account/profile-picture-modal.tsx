'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UploadButton } from '@/lib/uploadthing'
import { useToast } from '@/hooks/use-toast'
import { updateUserImage, removeUserImage } from '@/lib/actions/user.actions'
import { Upload, X, Camera } from 'lucide-react'

interface ProfilePictureModalProps {
  currentImage?: string
  userName: string
  className?: string
  avatarSize?: 'sm' | 'md' | 'lg' // sm=12 (48px), md=16 (64px), lg=20 (80px)
}

export default function ProfilePictureModal({
  currentImage,
  userName,
  className,
  avatarSize = 'sm',
}: ProfilePictureModalProps) {
  const [image, setImage] = useState(currentImage || '')
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRemoveImage = async () => {
    setIsRemoving(true)
    try {
      const result = await removeUserImage()
      if (result.success) {
        setImage('')
        toast({
          description: result.message,
        })
        router.refresh()
        setIsOpen(false) // Close modal on success
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
      }
    } catch {
      toast({
        variant: 'destructive',
        description: 'Failed to remove profile picture',
      })
    } finally {
      setIsRemoving(false)
    }
  }

  const getInitials = () => {
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarSizeClass = () => {
    switch (avatarSize) {
      case 'lg':
        return 'w-20 h-20'
      case 'md':
        return 'w-16 h-16'
      case 'sm':
      default:
        return 'w-12 h-12'
    }
  }

  const getAvatarTextSize = () => {
    switch (avatarSize) {
      case 'lg':
        return 'text-2xl'
      case 'md':
        return 'text-xl'
      case 'sm':
      default:
        return 'text-base'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className={className} title="Click to update profile picture">
          <Avatar className={`${getAvatarSizeClass()} cursor-pointer hover:opacity-80 transition-opacity`}>
            {image && (
              <AvatarImage src={image} alt={userName} />
            )}
            <AvatarFallback className={`bg-primary text-primary-foreground font-semibold ${getAvatarTextSize()}`}>
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Profile Picture
          </DialogTitle>
          <DialogDescription>
            Update your profile picture. Recommended: Square image, at least 200x200px, max 4MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Picture Preview */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-32 h-32">
              {image ? (
                <AvatarImage src={image} alt={userName} />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-4xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <div className="text-sm font-medium">
                {image ? 'Update your profile picture' : 'Add a profile picture'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {userName}
              </div>
            </div>
          </div>

          {/* Upload/Remove Actions */}
          <div className="space-y-3">
            {image ? (
              <div className="flex flex-col gap-2">
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={async (res) => {
                    setIsUploading(true)
                    try {
                      const result = await updateUserImage(res[0].url)
                      if (result.success) {
                        setImage(res[0].url)
                        toast({
                          description: result.message,
                        })
                        router.refresh()
                        setIsOpen(false) // Close modal on success
                      } else {
                        toast({
                          variant: 'destructive',
                          description: result.message,
                        })
                      }
                    } catch {
                      toast({
                        variant: 'destructive',
                        description: 'Failed to update profile picture',
                      })
                    } finally {
                      setIsUploading(false)
                    }
                  }}
                  onUploadError={(error) => {
                    toast({
                      variant: 'destructive',
                      description: `Upload failed: ${error.message}`,
                    })
                  }}
                  appearance={{
                    button: "ut-ready:bg-primary ut-uploading:bg-primary/50 text-sm w-full",
                    allowedContent: "hidden"
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={handleRemoveImage}
                  disabled={isRemoving || isUploading}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  {isRemoving ? 'Removing...' : 'Remove Picture'}
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Upload profile picture</div>
                    <div className="text-xs text-muted-foreground mb-4">
                      PNG or JPG format, max 4MB
                    </div>
                    <UploadButton
                      endpoint="imageUploader"
                      onClientUploadComplete={async (res) => {
                        setIsUploading(true)
                        try {
                          const result = await updateUserImage(res[0].url)
                          if (result.success) {
                            setImage(res[0].url)
                            toast({
                              description: result.message,
                            })
                            router.refresh()
                            setIsOpen(false) // Close modal on success
                          } else {
                            toast({
                              variant: 'destructive',
                              description: result.message,
                            })
                          }
                        } catch {
                          toast({
                            variant: 'destructive',
                            description: 'Failed to update profile picture',
                          })
                        } finally {
                          setIsUploading(false)
                        }
                      }}
                      onUploadError={(error) => {
                        toast({
                          variant: 'destructive',
                          description: `Upload failed: ${error.message}`,
                        })
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
            <div className="font-medium">Tips:</div>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use a clear photo of your face</li>
              <li>Square aspect ratio works best</li>
              <li>Professional photos recommended</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

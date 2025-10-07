'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadButton } from '@/lib/uploadthing'
import { useToast } from '@/hooks/use-toast'
import { updateUserImage, removeUserImage } from '@/lib/actions/user.actions'
import { Upload, X, Camera } from 'lucide-react'

interface ProfilePictureUploadProps {
  currentImage?: string
  userName: string
}

export default function ProfilePictureUpload({
  currentImage,
  userName,
}: ProfilePictureUploadProps) {
  const [image, setImage] = useState(currentImage || '')
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRemoveImage = async () => {
    setIsRemoving(true)
    try {
      const result = await removeUserImage()
      if (result.success) {
        toast({
          description: result.message,
        })
        // Use hard reload instead of router.refresh to avoid timing issues
        window.location.replace(window.location.href)
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
        setIsRemoving(false)
      }
    } catch {
      toast({
        variant: 'destructive',
        description: 'Failed to remove profile picture',
      })
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
            <Camera className="h-4 w-4 text-blue-600" />
          </div>
          Profile Picture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Picture Preview */}
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            {image ? (
              <AvatarImage src={image} alt={userName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-2xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="text-sm font-medium">
              {image ? 'Update your profile picture' : 'Add a profile picture'}
            </div>
            <div className="text-xs text-muted-foreground">
              Recommended: Square image, at least 200x200px, max 4MB
            </div>
          </div>
        </div>

        {/* Upload/Remove Actions */}
        <div className="space-y-3">
          {image ? (
            <div className="flex gap-2">
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={async (res) => {
                  setIsUploading(true)
                  try {
                    const result = await updateUserImage(res[0].url)
                    if (result.success) {
                      toast({
                        description: result.message,
                      })
                      // Use hard reload for consistency
                      window.location.replace(window.location.href)
                    } else {
                      toast({
                        variant: 'destructive',
                        description: result.message,
                      })
                      setIsUploading(false)
                    }
                  } catch {
                    toast({
                      variant: 'destructive',
                      description: 'Failed to update profile picture',
                    })
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
                  button: "ut-ready:bg-primary ut-uploading:bg-primary/50 text-sm",
                  allowedContent: "hidden"
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleRemoveImage}
                disabled={isRemoving || isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                {isRemoving ? 'Removing...' : 'Remove'}
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
                          toast({
                            description: result.message,
                          })
                          // Use hard reload for consistency
                          window.location.replace(window.location.href)
                        } else {
                          toast({
                            variant: 'destructive',
                            description: result.message,
                          })
                          setIsUploading(false)
                        }
                      } catch {
                        toast({
                          variant: 'destructive',
                          description: 'Failed to update profile picture',
                        })
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
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Guidelines:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use a clear photo of your face</li>
            <li>Square aspect ratio works best</li>
            <li>Avoid blurry or pixelated images</li>
            <li>Professional photos recommended</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

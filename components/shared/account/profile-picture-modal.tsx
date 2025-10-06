'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

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
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Sync local state with prop changes (when session updates)
  useEffect(() => {
    setImage(currentImage || '')
    setImageLoaded(false) // Reset loaded state when image changes
    setImageError(false)
  }, [currentImage])

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

  const hasImage = !!image

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className={className} title="View profile picture">
          <Avatar className={`${getAvatarSizeClass()} cursor-pointer hover:opacity-80 transition-opacity`}>
            {hasImage && (
              <AvatarImage 
                src={image || undefined} 
                alt={userName}
                className={cn(
                  'transition-opacity duration-200',
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            )}
            <AvatarFallback 
              className={cn(
                `bg-primary text-primary-foreground font-semibold ${getAvatarTextSize()} transition-opacity duration-200`,
                hasImage && !imageError && !imageLoaded ? 'opacity-0' : 'opacity-100'
              )}
            >
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Profile Picture</DialogTitle>
          <DialogDescription>
            To change your profile picture, go to Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Avatar Preview */}
          <div className="flex justify-center">
            <Avatar className="w-32 h-32">
              {hasImage && (
                <AvatarImage 
                  src={image || undefined} 
                  alt={userName}
                  className={cn(
                    'transition-opacity duration-200',
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              )}
              <AvatarFallback 
                className={cn(
                  "bg-primary text-primary-foreground font-semibold text-4xl transition-opacity duration-200",
                  hasImage && !imageError && !imageLoaded ? 'opacity-0' : 'opacity-100'
                )}
              >
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

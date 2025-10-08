'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  user: {
    name?: string | null
    image?: string | null
  }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  hasPassword?: boolean // true = credentials user (2 letters), false/undefined = OAuth user (1 letter)
}

export default function UserAvatar({ user, size = 'md', className, hasPassword }: UserAvatarProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getInitials = () => {
    if (!user.name) return 'U'
    
    // OAuth users (Google): Show 1 letter (first initial)
    // Credentials users (Email/Password): Show 2 letters (first + last initial)
    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
    
    return hasPassword ? initials.slice(0, 2) : initials.slice(0, 1)
  }

  const sizeClasses = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-32 h-32 text-3xl'
  }

  const hasImage = !!user.image

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {hasImage && (
        <AvatarImage 
          src={user.image || undefined} 
          alt={user.name || 'User'}
          className={cn(
            'object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}
      <AvatarFallback 
        className={cn(
          "bg-muted text-foreground font-semibold antialiased"
        )}
      >
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  )
}

'use client'

interface UserAvatarProps {
  src: string | null | undefined
  alt: string
  className?: string
}

export default function UserAvatar({ src, alt, className }: UserAvatarProps) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = '/images/missing-image.png'
  }

  return (
    <img
      src={src || '/images/missing-image.png'}
      alt={alt}
      className={className}
      onError={handleError}
    />
  )
}

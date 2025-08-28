'use client'

import { Button } from '@/components/ui/button'
import useSignOut from '@/hooks/use-sign-out'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface UserSignOutButtonProps {
  children: React.ReactNode
  className?: string
}

export default function UserSignOutButton({ 
  children, 
  className 
}: UserSignOutButtonProps) {
  const { signOut, isSigningOut } = useSignOut()

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: '/' // Redirect to home page after sign-out
    })
  }

  return (
    <Button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={cn(className)}
      variant='ghost'
    >
      {isSigningOut ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing out...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
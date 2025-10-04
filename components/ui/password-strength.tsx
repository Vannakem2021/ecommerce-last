'use client'

import { cn } from '@/lib/utils'

interface PasswordStrengthProps {
  password: string
  className?: string
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const getStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: '' }
    
    let score = 0
    
    // Length check
    if (pwd.length >= 8) score++
    if (pwd.length >= 12) score++
    
    // Character variety checks
    if (/[a-z]/.test(pwd)) score++ // lowercase
    if (/[A-Z]/.test(pwd)) score++ // uppercase
    if (/[0-9]/.test(pwd)) score++ // numbers
    if (/[^a-zA-Z0-9]/.test(pwd)) score++ // special chars
    
    // Determine strength level
    if (score <= 2) return { score: 33, label: 'Weak', color: 'bg-red-500' }
    if (score <= 4) return { score: 66, label: 'Medium', color: 'bg-amber-500' }
    return { score: 100, label: 'Strong', color: 'bg-green-500' }
  }

  const strength = getStrength(password)

  if (!password) return null

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', strength.color)}
            style={{ width: `${strength.score}%` }}
          />
        </div>
        <span className={cn('text-xs font-medium', {
          'text-red-600': strength.label === 'Weak',
          'text-amber-600': strength.label === 'Medium',
          'text-green-600': strength.label === 'Strong',
        })}>
          {strength.label}
        </span>
      </div>
    </div>
  )
}

export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }
}

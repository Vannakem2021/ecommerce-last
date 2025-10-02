'use client'

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  error?: boolean
  disabled?: boolean
  autoFocus?: boolean
  length?: number
}

export default function OTPInput({
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = true,
  length = 6,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  // Get individual digit value
  const getDigit = (index: number): string => {
    return value[index] || ''
  }

  // Handle input change
  const handleChange = (index: number, digit: string) => {
    // Only allow digits
    if (digit && !/^\d$/.test(digit)) {
      return
    }

    // Update value
    const newValue = value.split('')
    newValue[index] = digit
    const updatedValue = newValue.join('').slice(0, length)
    onChange(updatedValue)

    // Auto-advance to next input if digit entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Call onComplete if all digits entered
    if (updatedValue.length === length && onComplete) {
      onComplete(updatedValue)
    }
  }

  // Handle keydown for backspace navigation
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      
      // If current input has value, clear it
      if (getDigit(index)) {
        const newValue = value.split('')
        newValue[index] = ''
        onChange(newValue.join(''))
      } else if (index > 0) {
        // Move to previous input and clear it
        const newValue = value.split('')
        newValue[index - 1] = ''
        onChange(newValue.join(''))
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    } else if (e.key === 'Delete') {
      e.preventDefault()
      const newValue = value.split('')
      newValue[index] = ''
      onChange(newValue.join(''))
    }
  }

  // Handle paste
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length)
    
    // Only accept digits
    if (!/^\d+$/.test(pastedData)) {
      return
    }

    onChange(pastedData)

    // Focus last filled input or last input
    const focusIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[focusIndex]?.focus()

    // Call onComplete if all digits pasted
    if (pastedData.length === length && onComplete) {
      onComplete(pastedData)
    }
  }

  // Handle focus - select all text
  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select()
  }

  // Handle click - select all text
  const handleClick = (index: number) => {
    inputRefs.current[index]?.select()
  }

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={getDigit(index)}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          onClick={() => handleClick(index)}
          disabled={disabled}
          className={cn(
            'w-12 h-14 text-center text-2xl font-bold rounded-md border-2 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-input focus:border-primary focus:ring-primary',
            getDigit(index) && !error && 'border-primary'
          )}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  )
}

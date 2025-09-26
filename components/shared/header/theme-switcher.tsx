'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import * as React from 'react'

import useIsMounted from '@/hooks/use-is-mounted'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const isMounted = useIsMounted()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className='header-button h-[41px]'
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' && isMounted ? (
        <Moon className='h-6 w-6' />
      ) : (
        <Sun className='h-6 w-6' />
      )}
    </button>
  )
}

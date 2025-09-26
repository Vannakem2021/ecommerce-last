'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import useColorStore from '@/hooks/use-color-store'
export function ColorProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const { theme } = useTheme()
  const { color, updateCssVariables } = useColorStore(theme)
  // Handle legacy color preferences
  React.useEffect(() => {
    const storedData = localStorage.getItem('colorStore')
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        if (parsed.state?.userColor === 'Red' || parsed.state?.userColor === 'Gold') {
          // Migrate Red and Gold users to Green
          localStorage.removeItem('colorStore')
        }
      } catch (e) {
        // Invalid stored data, clear it
        localStorage.removeItem('colorStore')
      }
    }
  }, [])

  React.useEffect(() => {
    updateCssVariables()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, color])

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

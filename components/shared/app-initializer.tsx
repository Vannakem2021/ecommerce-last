import React, { useEffect, useState } from 'react'
import useSettingStore from '@/hooks/use-setting-store'
import { ClientSetting } from '@/types'
import { isDevelopment, logEnvironmentStatus, getClientEnvironmentInfo } from '@/lib/utils/environment'
import { validateCriticalConfiguration } from '@/lib/utils/startup-validator'

export default function AppInitializer({
  setting,
  children,
}: {
  setting: ClientSetting
  children: React.ReactNode
}) {
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    // Critical configuration validation (non-blocking)
    try {
      const isConfigValid = validateCriticalConfiguration()

      if (!isConfigValid) {
        console.warn('⚠️  WARNING: Some application configuration is missing - app will continue with limited functionality')
      }
    } catch (error) {
      console.warn('⚠️  WARNING: Configuration validation failed:', error)
      console.warn('App will continue but some functionality may not work properly')
    }

    // Startup environment checks
    if (isDevelopment()) {
      console.log('🚀 App Initializer - Environment Check')
      try {
        const envInfo = getClientEnvironmentInfo()
        console.log('📊 Environment Info:', envInfo)

        // Log environment status for development
        logEnvironmentStatus()
      } catch (error) {
        console.warn('⚠️  Environment status check failed:', error)
      }
    }

    // Initialize the setting store when component mounts or setting changes
    useSettingStore.setState({
      setting,
    })
    setRendered(true)
  }, [setting])

  // Don't render children until the store is initialized
  if (!rendered) {
    return null
  }

  return children
}

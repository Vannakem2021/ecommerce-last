import React, { useEffect, useState } from 'react'
import useSettingStore from '@/hooks/use-setting-store'
import { ClientSetting } from '@/types'
import { isDevelopment, logEnvironmentStatus } from '@/lib/utils/environment'
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
      validateCriticalConfiguration()
    } catch (error) {
      // Silently handle configuration validation errors
    }

    // Startup environment checks (only in development)
    if (isDevelopment()) {
      try {
        logEnvironmentStatus()
      } catch (error) {
        // Silently handle environment check errors
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

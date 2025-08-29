import React, { useEffect, useState } from 'react'
import useSettingStore from '@/hooks/use-setting-store'
import { ClientSetting } from '@/types'

export default function AppInitializer({
  setting,
  children,
}: {
  setting: ClientSetting
  children: React.ReactNode
}) {
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
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

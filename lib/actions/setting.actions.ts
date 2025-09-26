'use server'
import { ISettingInput } from '@/types'
import data from '../data'
import Setting from '../db/models/setting.model'
import { connectToDatabase } from '../db'
import { formatError } from '../utils'
import { cookies } from 'next/headers'
import { requirePermission } from '../rbac'

const globalForSettings = global as unknown as {
  cachedSettings: ISettingInput | null
  cacheTimestamp: number | null
}

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000
export const getNoCachedSetting = async (): Promise<ISettingInput> => {
  await connectToDatabase()
  const setting = await Setting.findOne()
  return JSON.parse(JSON.stringify(setting)) as ISettingInput
}

export const getSetting = async (): Promise<ISettingInput> => {
  const now = Date.now()
  const isExpired = globalForSettings.cacheTimestamp &&
    (now - globalForSettings.cacheTimestamp) > CACHE_EXPIRATION_MS

  if (!globalForSettings.cachedSettings || isExpired) {
    try {
      console.log('hit db - cache miss or expired')
      await connectToDatabase()
      const setting = await Setting.findOne().lean()
      globalForSettings.cachedSettings = setting
        ? JSON.parse(JSON.stringify(setting))
        : data.settings[0]
      globalForSettings.cacheTimestamp = now
    } catch (error) {
      console.error('Failed to fetch settings from database:', error)
      // Return default settings if database fails
      if (!globalForSettings.cachedSettings) {
        globalForSettings.cachedSettings = data.settings[0]
        globalForSettings.cacheTimestamp = now
      }
    }
  }
  return globalForSettings.cachedSettings as ISettingInput
}

// Cache invalidation function
export const invalidateSettingsCache = async () => {
  globalForSettings.cachedSettings = null
  globalForSettings.cacheTimestamp = null
}

export const updateSetting = async (newSetting: ISettingInput) => {
  try {
    // Check if current user has permission to update settings
    await requirePermission('settings.update')

    await connectToDatabase()
    const updatedSetting = await Setting.findOneAndUpdate({}, newSetting, {
      upsert: true,
      new: true,
    }).lean()
    globalForSettings.cachedSettings = JSON.parse(
      JSON.stringify(updatedSetting)
    ) // Update the cache
    globalForSettings.cacheTimestamp = Date.now() // Update cache timestamp
    return {
      success: true,
      message: 'Setting updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}


'use server'

import { requirePermission } from '../rbac'
import { testTelegramConfiguration } from '../telegram'
import { formatError } from '../utils'

/**
 * Test Telegram bot configuration
 * Requires settings.update permission
 */
export async function testTelegramBot(botToken: string, chatId: string) {
  try {
    // Check if current user has permission to test Telegram settings
    await requirePermission('settings.update')

    if (!botToken || !chatId) {
      return {
        success: false,
        message: 'Bot token and chat ID are required'
      }
    }

    const result = await testTelegramConfiguration(botToken, chatId)
    
    return {
      success: result.success,
      message: result.message
    }

  } catch (error) {
    return {
      success: false,
      message: formatError(error)
    }
  }
}



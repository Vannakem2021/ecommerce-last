// Using direct HTTP calls instead of node-telegram-bot-api for better server-side compatibility
import { IOrder } from './db/models/order.model'
import { OrderItem } from '@/types'
import { formatCurrency } from './utils'
import { getSetting } from './actions/setting.actions'

export interface TelegramMessage {
  orderId: string
  customerName: string
  customerEmail: string
  totalAmount: number
  items: OrderItem[]
  type: 'paid' | 'delivered'
  createdAt: Date
}

/**
 * Send a Telegram notification for order events
 * @param message - The message data to send
 * @returns Promise<boolean> - Success status
 */
export async function sendTelegramNotification(message: TelegramMessage): Promise<boolean> {
  try {
    const settings = await getSetting()

    // Check if Telegram is enabled and configured
    if (!settings.telegram?.enabled || !settings.telegram?.botToken || !settings.telegram?.chatId) {
      return false
    }

    // Check if this notification type is enabled
    const notificationTypes = settings.telegram.notificationTypes
    if (!notificationTypes) {
      return false
    }

    let shouldSend = false
    switch (message.type) {
      case 'paid':
        shouldSend = notificationTypes.orderPaid
        break
      case 'delivered':
        shouldSend = notificationTypes.orderDelivered
        break
    }

    if (!shouldSend) {
      return false
    }

    // Format the message
    const formattedMessage = formatTelegramMessage(message)

    // Send the message using direct HTTP call
    const response = await fetch(`https://api.telegram.org/bot${settings.telegram.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: settings.telegram.chatId,
        text: formattedMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Telegram API error: ${errorData.description || response.statusText}`)
    }

    return true

  } catch (error) {
    return false
  }
}

/**
 * Format the order data into a Telegram message
 * @param message - The message data
 * @returns Formatted HTML message string
 */
function formatTelegramMessage(message: TelegramMessage): string {
  const { orderId, customerName, customerEmail, totalAmount, items, type, createdAt } = message

  let title = ''
  let emoji = ''

  switch (type) {
    case 'paid':
      title = 'Order Payment Confirmed'
      emoji = '💳'
      break
    case 'delivered':
      title = 'Order Delivered'
      emoji = '📦'
      break
  }

  const date = new Date(createdAt).toLocaleString()
  const itemsList = items.map(item => 
    `• ${item.name} (x${item.quantity}) - ${formatCurrency(item.price * item.quantity)}`
  ).join('\n')

  return `${emoji} <b>${title}</b>

<b>Order ID:</b> ${orderId}
<b>Customer:</b> ${customerName}
<b>Email:</b> ${customerEmail}
<b>Date:</b> ${date}
<b>Total:</b> ${formatCurrency(totalAmount)}

<b>Items:</b>
${itemsList}

${type === 'paid' ? '✅ Payment confirmed - ready for processing!' : ''}
${type === 'delivered' ? '🎉 Order successfully delivered!' : ''}`
}

/**
 * Test Telegram bot configuration
 * @param botToken - The bot token to test
 * @param chatId - The chat ID to test
 * @returns Promise<{success: boolean, message: string}>
 */
export async function testTelegramConfiguration(
  botToken: string,
  chatId: string
): Promise<{success: boolean, message: string}> {
  try {
    if (!botToken || !chatId) {
      return {
        success: false,
        message: 'Bot token and chat ID are required'
      }
    }

    // Verify the bot token
    const botResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
    if (!botResponse.ok) {
      return {
        success: false,
        message: 'Invalid bot token.'
      }
    }

    // Test message
    const testMessage = `🧪 <b>Test Message</b>

This is a test message from your e-commerce store.
If you receive this message, your Telegram bot is configured correctly!

<i>Sent at: ${new Date().toLocaleString()}</i>`

    // Send test message
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: testMessage,
        parse_mode: 'HTML'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.description || response.statusText)
    }

    return {
      success: true,
      message: 'Test message sent successfully! Check your Telegram chat.'
    }

  } catch (error) {
    let errorMessage = 'Failed to send test message'
    if (error instanceof Error) {
      if (error.message.includes('chat not found')) {
        errorMessage = 'Chat not found. Ensure the bot is added to the chat and has permission to send messages.'
      } else if (error.message.includes('Forbidden')) {
        errorMessage = 'Bot is forbidden from sending messages. Check bot permissions.'
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'Invalid bot token.'
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      message: errorMessage
    }
  }
}

/**
 * Helper function to create Telegram message from order
 * @param order - The order object
 * @param type - The notification type
 * @returns TelegramMessage object
 */
export function createTelegramMessageFromOrder(
  order: IOrder,
  type: 'paid' | 'delivered'
): TelegramMessage {
  const user = order.user as { name: string; email: string }
  
  return {
    orderId: order._id.toString(),
    customerName: user.name,
    customerEmail: user.email,
    totalAmount: order.totalPrice,
    items: order.items,
    type,
    createdAt: order.createdAt
  }
}



/**
 * Send order paid notification
 * @param order - The order object
 * @returns Promise<boolean>
 */
export async function sendOrderPaidNotification(order: IOrder): Promise<boolean> {
  const message = createTelegramMessageFromOrder(order, 'paid')
  return await sendTelegramNotification(message)
}

/**
 * Send order delivered notification
 * @param order - The order object
 * @returns Promise<boolean>
 */
export async function sendOrderDeliveredNotification(order: IOrder): Promise<boolean> {
  const message = createTelegramMessageFromOrder(order, 'delivered')
  return await sendTelegramNotification(message)
}



import { Resend } from 'resend'
import PurchaseReceiptEmail from './purchase-receipt'
import { IOrder } from '@/lib/db/models/order.model'
import AskReviewOrderItemsEmail from './ask-review-order-items'
import PasswordResetEmail from './password-reset'
import { SENDER_EMAIL, SENDER_NAME } from '@/lib/constants'

const resend = new Resend(process.env.RESEND_API_KEY as string)

export const sendPurchaseReceipt = async ({ order }: { order: IOrder }) => {
  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: 'Order Confirmation',
    react: <PurchaseReceiptEmail order={order} />,
  })
}

export const sendAskReviewOrderItems = async ({ order }: { order: IOrder }) => {
  const oneDayFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()

  await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: (order.user as { email: string }).email,
    subject: 'Review your order items',
    react: <AskReviewOrderItemsEmail order={order} />,
    scheduledAt: oneDayFromNow,
  })
}

export const sendPasswordResetEmail = async ({
  resetToken,
  userEmail,
  userName,
}: {
  resetToken: string
  userEmail: string
  userName?: string
}) => {
  const { data, error } = await resend.emails.send({
    from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
    to: [userEmail],
    subject: 'Reset your password - BCS',
    react: <PasswordResetEmail resetToken={resetToken} userEmail={userEmail} userName={userName} />,
  })

  if (error) {
    console.error('Error sending password reset email:', error)
    return { success: false, error }
  }

  return { success: true, data }
}

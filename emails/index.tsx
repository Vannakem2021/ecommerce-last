import { Resend } from 'resend'
import PurchaseReceiptEmail from './purchase-receipt'
import { IOrder } from '@/lib/db/models/order.model'
import AskReviewOrderItemsEmail from './ask-review-order-items'
import PasswordResetEmail from './password-reset'
import EmailVerificationOTP from './email-verification-otp'
import PasswordResetOTP from './password-reset-otp'
import { SENDER_EMAIL, SENDER_NAME } from '@/lib/constants'
import { getSetting } from '@/lib/actions/setting.actions'
import { getSecureEnvVar, isProduction } from '@/lib/utils/environment'

const apiKey = getSecureEnvVar('RESEND_API_KEY', false)

if (isProduction() && !apiKey) {
  console.error('❌ ERROR: RESEND_API_KEY is required in production for email functionality')
}

const resend = apiKey ? new Resend(apiKey) : null

export const sendPurchaseReceipt = async ({ order }: { order: IOrder }) => {
  if (!resend) {
    console.warn('⚠️  Email service not configured - skipping purchase receipt email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const result = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: (order.user as { email: string }).email,
      subject: 'Order Confirmation',
      react: <PurchaseReceiptEmail order={order} />,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Error sending purchase receipt email:', error)
    return { success: false, error }
  }
}

export const sendAskReviewOrderItems = async ({ order }: { order: IOrder }) => {
  if (!resend) {
    console.warn('⚠️  Email service not configured - skipping review request email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const oneDayFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()

    const result = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: (order.user as { email: string }).email,
      subject: 'Review your order items',
      react: <AskReviewOrderItemsEmail order={order} />,
      scheduledAt: oneDayFromNow,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Error sending review request email:', error)
    return { success: false, error }
  }
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
  if (!resend) {
    console.error('❌ ERROR: Email service not configured - cannot send password reset email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { site } = await getSetting()

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [userEmail],
      subject: `Reset your password - ${site.name}`,
      react: <PasswordResetEmail
        resetToken={resetToken}
        userEmail={userEmail}
        userName={userName}
        siteName={site.name}
        siteLogo={site.logo}
      />,
    })

    if (error) {
      console.error('Error sending password reset email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { success: false, error }
  }
}


export const sendEmailVerificationOTP = async ({
  otp,
  userEmail,
  userName,
}: {
  otp: string
  userEmail: string
  userName?: string
}) => {
  if (!resend) {
    console.error('❌ ERROR: Email service not configured - cannot send verification OTP')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { site } = await getSetting()

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [userEmail],
      subject: `Verify your email - ${site.name}`,
      react: <EmailVerificationOTP
        otp={otp}
        userEmail={userEmail}
        userName={userName}
        siteName={site.name}
        siteLogo={site.logo}
        expiresInMinutes={10}
      />,
    })

    if (error) {
      console.error('Error sending verification OTP email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending verification OTP email:', error)
    return { success: false, error }
  }
}

export const sendPasswordResetOTP = async ({
  otp,
  userEmail,
  userName,
}: {
  otp: string
  userEmail: string
  userName?: string
}) => {
  if (!resend) {
    console.error('❌ ERROR: Email service not configured - cannot send password reset OTP')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { site } = await getSetting()

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [userEmail],
      subject: `Reset your password - ${site.name}`,
      react: <PasswordResetOTP
        otp={otp}
        userEmail={userEmail}
        userName={userName}
        siteName={site.name}
        siteLogo={site.logo}
        expiresInMinutes={15}
      />,
    })

    if (error) {
      console.error('Error sending password reset OTP email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending password reset OTP email:', error)
    return { success: false, error }
  }
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface ABAPayWayFormProps {
  orderId: string
  amount: number
}

export default function ABAPayWayForm({ orderId, amount }: ABAPayWayFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paymentInProgress, setPaymentInProgress] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  
  // Use refs to persist across hot reloads
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check order payment status
  const checkOrderStatus = useCallback(async () => {
    try {
      console.log('[Payment] Checking order status...')
      const response = await fetch(`/api/orders/${orderId}/status`)
      if (response.ok) {
        const data = await response.json()
        console.log('[Payment] Order status:', data)
        
        if (data.isPaid) {
          // Payment completed! Stop polling and refresh page to show confetti
          console.log('[Payment] Payment detected! Stopping polling and refreshing page...')
          
          // Clear polling intervals
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current)
            pollTimeoutRef.current = null
          }
          
          toast({
            title: 'Payment Successful!',
            description: 'Your payment has been processed.',
          })
          
          // Refresh the page - this will show confetti and then auto-redirect to order details
          // The payment-form.tsx component will handle the confetti animation and redirect
          router.refresh()
        } else if (data.paymentResult?.status === 'CANCELLED') {
          // Payment was cancelled - stop polling
          console.log('[Payment] Payment cancelled by user, stopping polling')
          
          // Clear polling intervals
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current)
            pollTimeoutRef.current = null
          }
          
          setPaymentInProgress(false)
          setIsLoading(false)
          toast({
            title: 'Payment Cancelled',
            description: 'You cancelled the payment. You can try again.',
            variant: 'destructive',
          })
        } else if (data.paymentResult?.status === 'FAILED') {
          // Payment failed - stop polling
          console.log('[Payment] Payment failed, stopping polling')
          
          // Clear polling intervals
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current)
            pollTimeoutRef.current = null
          }
          
          setPaymentInProgress(false)
          setIsLoading(false)
          toast({
            title: 'Payment Failed',
            description: 'Your payment could not be processed. Please try again.',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      console.error('[Payment] Failed to check order status:', error)
    }
  }, [orderId, router, toast])

  // Check payment status when user returns to page (tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && paymentInProgress) {
        console.log('[Payment] Tab became visible, checking status...')
        checkOrderStatus()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkOrderStatus, paymentInProgress])

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      console.log('[Payment] Component unmounting, cleaning up intervals...')
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
        pollTimeoutRef.current = null
      }
    }
  }, [])

  const handlePayment = async () => {
    // Prevent double-click - check both loading states
    if (isLoading || paymentInProgress) {
      console.log('[Payment] Already processing, ignoring click')
      return
    }

    console.log('[Payment] Starting payment process for order:', orderId)

    try {
      setIsLoading(true)

      // Call the create-payment API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log('[Payment] Request timeout after 30 seconds')
        controller.abort()
      }, 30000) // 30 second timeout

      console.log('[Payment] Calling create-payment API...')
      const response = await fetch('/api/aba-payway/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log('[Payment] API response received:', response.status)

      const data = await response.json()
      console.log('[Payment] Response data:', { success: data.success, error: data.error })

      if (!response.ok) {
        console.error('[Payment] API error response:', data)
        throw new Error(data.error || 'Failed to create payment')
      }

      if (!data.success) {
        console.error('[Payment] Payment creation failed:', data)
        throw new Error(data.error || 'Payment creation failed')
      }

      console.log('[Payment] Creating and submitting form to ABA PayWay...')

      // Create a form and submit it to ABA PayWay
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.paymentUrl
      form.target = '_blank' // Open in new tab (keeps your checkout page open)

      console.log('[Payment] Form action:', data.paymentUrl)

      // Add all payment parameters as hidden inputs
      Object.entries(data.paymentParams).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value as string
        form.appendChild(input)
      })

      console.log('[Payment] Form created with', Object.keys(data.paymentParams).length, 'parameters')

      // Append form to body and submit
      document.body.appendChild(form)
      console.log('[Payment] Submitting form...')
      form.submit()
      console.log('[Payment] Form submitted successfully')
      
      // Remove form after a delay to allow browser to process the submission
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form)
          console.log('[Payment] Form cleaned up')
        }
      }, 1000) // 1 second delay

      toast({
        title: 'Payment Window Opened',
        description: 'Complete your payment in the new tab. This page will update automatically when payment is completed.',
      })

      // Mark payment as in progress (keeps button disabled)
      setIsLoading(false)
      setPaymentInProgress(true)

      // Clear any existing intervals first
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }

      // Start polling for payment completion
      console.log('[Payment] Starting polling interval...')
      pollIntervalRef.current = setInterval(() => {
        checkOrderStatus()
      }, 3000) // Check every 3 seconds

      // Stop polling after 5 minutes
      pollTimeoutRef.current = setTimeout(() => {
        console.log('[Payment] Polling timeout reached (5 minutes)')
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setPaymentInProgress(false)
        setIsLoading(false)
      }, 5 * 60 * 1000)

    } catch (error) {
      console.error('[Payment] ERROR:', error)
      console.error('[Payment] Error name:', error instanceof Error ? error.name : 'Unknown')
      console.error('[Payment] Error message:', error instanceof Error ? error.message : 'Unknown')
      console.error('[Payment] Error stack:', error instanceof Error ? error.stack : 'Unknown')
      
      // ALWAYS reset loading state on error
      setIsLoading(false)
      setPaymentInProgress(false)
      
      // Handle timeout separately
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[Payment] Request aborted due to timeout')
        toast({
          title: 'Connection Timeout',
          description: 'The request took too long. Please check your connection and try again.',
          variant: 'destructive',
        })
      } else {
        console.error('[Payment] Payment initiation failed')
        toast({
          title: 'Payment Error',
          description: error instanceof Error ? error.message : 'Failed to initiate payment',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePayment}
        disabled={isLoading || paymentInProgress}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : paymentInProgress ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Payment in Progress...
          </>
        ) : (
          `Pay $${amount.toFixed(2)} with ABA PayWay`
        )}
      </Button>

      <div className="text-xs text-gray-500 text-center">
        <p>Secure payment powered by ABA Bank</p>
        <p>Your payment information is encrypted and secure</p>
      </div>
    </div>
  )
}

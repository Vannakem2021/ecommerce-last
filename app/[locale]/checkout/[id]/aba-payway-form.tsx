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
      const response = await fetch(`/api/orders/${orderId}/status`)
      if (response.ok) {
        const data = await response.json()
        
        if (data.isPaid) {
          // Payment completed - stop polling and redirect
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current)
            pollTimeoutRef.current = null
          }
          
          router.push(`/account/orders/${orderId}`)
        } else if (data.paymentResult?.status === 'CANCELLED') {
          // Payment was cancelled - stop polling
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
      console.error('Failed to check order status:', error)
    }
  }, [orderId, router, toast])

  // Check payment status when user returns to page (tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && paymentInProgress) {
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
    // Prevent double-click
    if (isLoading || paymentInProgress) {
      return
    }

    try {
      setIsLoading(true)

      // Call the create-payment API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch('/api/aba-payway/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment')
      }

      if (!data.success) {
        throw new Error(data.error || 'Payment creation failed')
      }

      // Create a form and submit it to ABA PayWay
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.paymentUrl
      form.target = '_blank'

      // Add all payment parameters as hidden inputs
      Object.entries(data.paymentParams).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value as string
        form.appendChild(input)
      })

      // Append form to body and submit
      document.body.appendChild(form)
      form.submit()
      
      // Remove form after a delay to allow browser to process the submission
      setTimeout(() => {
        if (document.body.contains(form)) {
          document.body.removeChild(form)
        }
      }, 1000)

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
      pollIntervalRef.current = setInterval(() => {
        checkOrderStatus()
      }, 3000)

      // Stop polling after 5 minutes
      pollTimeoutRef.current = setTimeout(() => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        setPaymentInProgress(false)
        setIsLoading(false)
      }, 5 * 60 * 1000)

    } catch (error) {
      console.error('ABA PayWay payment error:', error)
      
      // Reset loading state on error
      setIsLoading(false)
      setPaymentInProgress(false)
      
      // Handle timeout separately
      if (error instanceof Error && error.name === 'AbortError') {
        toast({
          title: 'Connection Timeout',
          description: 'The request took too long. Please check your connection and try again.',
          variant: 'destructive',
        })
      } else {
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

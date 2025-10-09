'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const { toast } = useToast()
  const router = useRouter()

  // Check order payment status
  const checkOrderStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`)
      if (response.ok) {
        const data = await response.json()
        if (data.isPaid) {
          // Payment completed! Refresh the page to show success
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Failed to check order status:', error)
    }
  }, [orderId, router])

  // Check payment status when user returns to page (tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to this tab - check if payment was completed
        checkOrderStatus()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkOrderStatus])

  const handlePayment = async () => {
    // Prevent double-click
    if (isLoading) {
      return
    }

    try {
      setIsLoading(true)

      // Call the create-payment API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

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
      form.target = '_blank' // Open in new tab

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
      document.body.removeChild(form)

      toast({
        title: 'Payment Window Opened',
        description: 'Complete your payment in the new window. This page will update automatically.',
      })

      // Reset loading state after form submission
      setIsLoading(false)

      // Start polling for payment completion
      const pollInterval = setInterval(() => {
        checkOrderStatus()
      }, 3000) // Check every 3 seconds

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
      }, 5 * 60 * 1000)

    } catch (error) {
      console.error('ABA PayWay payment error:', error)
      
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
      
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
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

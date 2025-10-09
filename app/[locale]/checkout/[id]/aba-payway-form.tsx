'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface ABAPayWayFormProps {
  orderId: string
  amount: number
}

export default function ABAPayWayForm({ orderId, amount }: ABAPayWayFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasClicked, setHasClicked] = useState(false)
  const { toast } = useToast()

  const handlePayment = async () => {
    // Prevent double-click
    if (isLoading || hasClicked) {
      return
    }

    try {
      setIsLoading(true)
      setHasClicked(true)

      // Show loading toast immediately
      toast({
        title: 'Creating payment...',
        description: 'Please wait while we prepare your payment.',
      })

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
        title: 'Redirecting to ABA PayWay',
        description: 'Please complete your payment in the new tab.',
      })

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
      
      // Allow retry after error
      setHasClicked(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePayment}
        disabled={isLoading || hasClicked}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting to payment gateway...
          </>
        ) : hasClicked ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening payment page...
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

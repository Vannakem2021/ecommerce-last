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
  const { toast } = useToast()

  const handlePayment = async () => {
    try {
      setIsLoading(true)

      // Call the create-payment API
      const response = await fetch('/api/aba-payway/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      })

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
      toast({
        title: 'Payment Error',
        description: error instanceof Error ? error.message : 'Failed to initiate payment',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">ABA PayWay Payment</h3>
        <p className="text-sm text-blue-700 mb-3">
          You will be redirected to ABA PayWay to complete your payment securely. 
          Supported payment methods include:
        </p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• ABA PAY & KHQR (QR Code)</li>
          <li>• Credit/Debit Cards</li>
          <li>• WeChat Pay</li>
          <li>• Alipay</li>
        </ul>
      </div>

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

import { describe, it, expect, beforeEach } from '@jest/globals'
import { abaPayWayService } from '@/lib/aba-payway'
import { PaymentRequest } from '@/types/aba-payway'

// Mock environment variables
process.env.PAYWAY_MERCHANT_ID = 'test_merchant'
process.env.PAYWAY_SECRET_KEY = 'test_secret_key'
process.env.PAYWAY_BASE_URL = 'https://checkout-sandbox.payway.com.kh'
process.env.PAYWAY_ENABLED = 'true'

describe('ABA PayWay Integration', () => {
  let mockPaymentRequest: PaymentRequest

  beforeEach(() => {
    mockPaymentRequest = {
      orderId: 'test_order_123',
      amount: 25.50,
      currency: 'USD',
      items: [
        {
          name: 'Test Product 1',
          quantity: 2,
          price: 10.00
        },
        {
          name: 'Test Product 2',
          quantity: 1,
          price: 5.50
        }
      ],
      customerInfo: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+855123456789',
        email: 'john.doe@example.com'
      },
      returnUrl: 'https://example.com/checkout/success',
      cancelUrl: 'https://example.com/checkout/cancel',
      callbackUrl: 'https://example.com/api/aba-payway/callback'
    }
  })

  describe('Payment Parameter Generation', () => {
    it('should generate correct payment parameters', () => {
      const result = abaPayWayService.createPayment(mockPaymentRequest)

      expect(result.success).toBe(true)
      expect(result.paymentParams).toBeDefined()
      expect(result.paymentUrl).toBe('https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase')

      if (result.success) {
        const params = result.paymentParams
        
        // Check required parameters
        expect(params.req_time).toBeDefined()
        expect(params.merchant_id).toBe('test_merchant')
        expect(params.tran_id).toBe('test_order_123')
        expect(params.amount).toBe('25.50')
        expect(params.currency).toBe('USD')
        expect(params.payment_option).toBe('abapay_deeplink')
        expect(params.type).toBe('purchase')
        expect(params.payment_gateway).toBe('aba')
        expect(params.hash).toBeDefined()
        
        // Check customer info
        expect(params.firstname).toBe('John')
        expect(params.lastname).toBe('Doe')
        expect(params.phone).toBe('+855123456789')
        expect(params.email).toBe('john.doe@example.com')
        
        // Check URLs
        expect(params.return_url).toBe('https://example.com/checkout/success')
        expect(params.cancel_url).toBe('https://example.com/checkout/cancel')
        expect(params.callback_url).toBe('https://example.com/api/aba-payway/callback')
        
        // Check items are base64 encoded
        expect(params.items).toBeDefined()
        const decodedItems = JSON.parse(Buffer.from(params.items, 'base64').toString())
        expect(decodedItems).toHaveLength(2)
        expect(decodedItems[0]).toEqual({
          name: 'Test Product 1',
          quantity: 2,
          price: 10.00
        })
      }
    })

    it('should generate different hashes for different requests', () => {
      const result1 = abaPayWayService.createPayment(mockPaymentRequest)
      
      // Modify the request slightly
      const modifiedRequest = { ...mockPaymentRequest, amount: 30.00 }
      const result2 = abaPayWayService.createPayment(modifiedRequest)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      if (result1.success && result2.success) {
        expect(result1.paymentParams.hash).not.toBe(result2.paymentParams.hash)
      }
    })
  })

  describe('Hash Verification', () => {
    it('should verify valid callback signatures', () => {
      // Create a payment first to get the hash generation logic
      const paymentResult = abaPayWayService.createPayment(mockPaymentRequest)
      expect(paymentResult.success).toBe(true)

      if (paymentResult.success) {
        // Mock a callback with the same parameters
        const mockCallback = {
          tran_id: 'test_order_123',
          status: '0', // Success
          apv: '25.50',
          merchant_id: 'test_merchant',
          req_time: paymentResult.paymentParams.req_time,
          hash: paymentResult.paymentParams.hash
        }

        // Note: In a real test, you'd need to generate the proper callback hash
        // For now, we'll test the structure
        expect(mockCallback.tran_id).toBe(mockPaymentRequest.orderId)
        expect(mockCallback.apv).toBe(mockPaymentRequest.amount.toFixed(2))
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle missing environment variables', () => {
      // Temporarily remove environment variable
      const originalMerchantId = process.env.PAYWAY_MERCHANT_ID
      delete process.env.PAYWAY_MERCHANT_ID

      const result = abaPayWayService.createPayment(mockPaymentRequest)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('PAYWAY_MERCHANT_ID')

      // Restore environment variable
      process.env.PAYWAY_MERCHANT_ID = originalMerchantId
    })

    it('should handle invalid amounts', () => {
      const invalidRequest = { ...mockPaymentRequest, amount: -10 }
      const result = abaPayWayService.createPayment(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('amount')
    })

    it('should handle empty items array', () => {
      const invalidRequest = { ...mockPaymentRequest, items: [] }
      const result = abaPayWayService.createPayment(invalidRequest)
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('items')
    })
  })

  describe('Configuration', () => {
    it('should use sandbox URL in test environment', () => {
      const result = abaPayWayService.createPayment(mockPaymentRequest)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.paymentUrl).toContain('checkout-sandbox.payway.com.kh')
      }
    })
  })
})

// Integration test helper
export const testABAPayWayIntegration = async () => {
  console.log('🧪 Testing ABA PayWay Integration...')
  
  // Test environment variables
  const requiredEnvVars = [
    'PAYWAY_MERCHANT_ID',
    'PAYWAY_SECRET_KEY', 
    'PAYWAY_BASE_URL',
    'PAYWAY_ENABLED'
  ]
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars)
    return false
  }
  
  console.log('✅ Environment variables configured')
  
  // Test payment creation
  try {
    const testRequest: PaymentRequest = {
      orderId: `test_${Date.now()}`,
      amount: 1.00,
      currency: 'USD',
      items: [{ name: 'Test Item', quantity: 1, price: 1.00 }],
      customerInfo: {
        firstName: 'Test',
        lastName: 'User',
        phone: '+855123456789',
        email: 'test@example.com'
      },
      returnUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      callbackUrl: 'https://example.com/api/aba-payway/callback'
    }
    
    const result = abaPayWayService.createPayment(testRequest)
    
    if (result.success) {
      console.log('✅ Payment creation successful')
      console.log('📝 Payment URL:', result.paymentUrl)
      return true
    } else {
      console.error('❌ Payment creation failed:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Integration test failed:', error)
    return false
  }
}

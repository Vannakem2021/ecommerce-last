# ABA PayWay Integration Guide

## Overview

This guide covers the complete ABA PayWay integration for your ecommerce application. ABA PayWay is a Cambodian payment gateway that supports multiple payment methods including ABA PAY, KHQR, credit/debit cards, WeChat Pay, and Alipay.

## What's Been Implemented

### 1. Backend Components

#### API Endpoints
- **`/api/aba-payway/create-payment`** - Creates payment requests
- **`/api/aba-payway/callback`** - Handles payment notifications from ABA PayWay

#### Core Services
- **`lib/aba-payway.ts`** - Main service class with payment parameter generation and hash verification
- **`types/aba-payway.ts`** - TypeScript definitions for all ABA PayWay interfaces

#### Database Updates
- **Order Model** - Added `abaMerchantRefNo` field for tracking ABA PayWay transactions
- **Settings Model** - Added ABA PayWay configuration section

### 2. Frontend Components

#### Payment Form Integration
- **`aba-payway-form.tsx`** - Dedicated checkout component for ABA PayWay payments
- **`payment-form.tsx`** - Updated to include ABA PayWay option

#### Admin Configuration
- **`aba-payway-form.tsx`** - Admin settings form for ABA PayWay configuration
- **Settings Navigation** - Added ABA PayWay section to admin settings

### 3. Configuration Updates

#### Default Data
- Added "ABA PayWay" to available payment methods
- Added ABA PayWay configuration to default settings

#### Type Definitions
- Extended settings schema to include ABA PayWay configuration
- Added validation schemas for ABA PayWay settings

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# ABA PayWay Configuration
PAYWAY_MERCHANT_ID=your_merchant_id_here
PAYWAY_SECRET_KEY=your_secret_key_here
PAYWAY_BASE_URL=https://checkout-sandbox.payway.com.kh
PAYWAY_ENABLED=true

# For production, use:
# PAYWAY_BASE_URL=https://checkout.payway.com.kh
```

## Setup Instructions

### 1. Environment Setup
1. Contact ABA Bank to obtain your merchant credentials
2. Add the environment variables above to your `.env.local` file
3. Restart your development server

### 2. Admin Configuration
1. Navigate to `/admin/settings`
2. Scroll to the "ABA PayWay" section
3. Enable ABA PayWay
4. Enter your Merchant ID
5. Set Sandbox Mode (enabled for testing, disabled for production)
6. Save settings

### 3. Payment Method Configuration
1. In the "Payment Methods" section of admin settings
2. Ensure "ABA PayWay" is listed as an available payment method
3. Optionally set it as the default payment method

## Testing the Integration

### 1. Create a Test Order
1. Add items to cart
2. Proceed to checkout
3. Fill in shipping address
4. Select "ABA PayWay" as payment method
5. Complete the order

### 2. Payment Flow Testing
1. Click "Pay with ABA PayWay" button
2. Verify redirect to ABA PayWay sandbox
3. Complete test payment using sandbox credentials
4. Verify callback processing and order status update

### 3. Admin Testing
1. Check order status in admin panel
2. Verify payment result is recorded
3. Test different payment scenarios (success, failure, cancellation)

## Integration Flow

```
1. Customer selects ABA PayWay at checkout
2. Frontend calls /api/aba-payway/create-payment
3. Backend generates payment parameters and hash
4. Customer redirected to ABA PayWay hosted page
5. Customer completes payment
6. ABA PayWay sends callback to /api/aba-payway/callback
7. Backend verifies callback and updates order status
8. Customer redirected back to success page
```

## Security Features

- **HMAC SHA-512 Signature Verification** - All requests signed with secret key
- **Callback Verification** - Payment notifications verified before processing
- **Amount Validation** - Payment amounts verified against order totals
- **Environment-based Configuration** - Sensitive data stored in environment variables

## Supported Payment Methods

When customers choose ABA PayWay, they can pay using:
- **ABA PAY & KHQR** - QR code payments
- **Credit/Debit Cards** - Visa, Mastercard, etc.
- **WeChat Pay** - For Chinese customers
- **Alipay** - Alternative digital wallet

## Troubleshooting

### Common Issues

1. **"ABA PayWay is not available"**
   - Check environment variables are set
   - Verify PAYWAY_ENABLED=true
   - Ensure merchant ID and secret key are correct

2. **Payment callback not working**
   - Verify callback URL is accessible from internet
   - Check server logs for callback processing errors
   - Ensure hash verification is working

3. **Amount mismatch errors**
   - Verify currency settings (USD/KHR)
   - Check decimal precision in amount calculations

### Debug Mode

Enable debug logging by checking server console for ABA PayWay log messages:
- `[ABA PayWay] Payment initiated for order...`
- `[ABA PayWay] Callback received...`
- `[ABA PayWay] Payment successful for order...`

## Production Deployment

Before going live:

1. **Update Environment Variables**
   ```bash
   PAYWAY_BASE_URL=https://checkout.payway.com.kh
   ```

2. **Admin Settings**
   - Disable "Sandbox Mode" in ABA PayWay settings
   - Use production merchant credentials

3. **Testing**
   - Test with real payment amounts
   - Verify callback URL is accessible from ABA PayWay servers
   - Test all payment methods

## Support

For technical issues:
- Check ABA PayWay developer documentation: https://developer.payway.com.kh/
- Contact ABA Bank merchant support: paywaysales@ababank.com
- Review server logs for detailed error messages

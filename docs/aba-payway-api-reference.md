# ABA PayWay API Reference

## Overview

Based on the official ABA PayWay developer documentation at https://developer.payway.com.kh, here are the key API endpoints for payment status management.

## Base URLs

- **Sandbox**: `https://checkout-sandbox.payway.com.kh`
- **Production**: `https://checkout.payway.com.kh`

## Authentication

All API requests require HMAC SHA-512 signature verification using your merchant secret key.

## Payment Status Endpoints

### 1. Check Transaction Status

**Endpoint**: `POST /api/payment-gateway/v1/payments/check-transaction-2`

**Purpose**: Query the current status of a payment transaction

**Request Parameters**:
```json
{
  "tran_id": "string",      // Transaction ID (merchant reference)
  "merchant_id": "string",  // Your merchant ID
  "hash": "string"          // HMAC SHA-512 signature
}
```

**Hash Generation**:
```javascript
const dataToHash = tran_id + merchant_id;
const hash = crypto.createHmac('sha512', secretKey)
  .update(dataToHash)
  .digest('base64');
```

**Response**:
```json
{
  "tran_id": "string",
  "status": 0,              // 0=success, 1=cancelled, 2=declined, 3=error
  "amount": "100.00",
  "currency": "USD",
  "payment_date": "2024-01-01 12:00:00",
  "description": "Payment completed successfully"
}
```

### 2. Get Transaction Details

**Endpoint**: `POST /api/payment-gateway/v1/payments/transaction-detail`

**Purpose**: Get detailed information about a specific transaction

**Request Parameters**:
```json
{
  "tran_id": "string",
  "merchant_id": "string",
  "hash": "string"
}
```

**Response**:
```json
{
  "tran_id": "string",
  "status": 0,
  "amount": "100.00",
  "currency": "USD",
  "payment_method": "ABA_PAY",
  "customer_info": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "created_at": "2024-01-01 12:00:00",
  "completed_at": "2024-01-01 12:05:00"
}
```

### 3. Get Transaction List

**Endpoint**: `POST /api/payment-gateway/v1/payments/transaction-list-2`

**Purpose**: Retrieve a list of transactions for reconciliation

**Request Parameters**:
```json
{
  "merchant_id": "string",
  "from_date": "2024-01-01",
  "to_date": "2024-01-31",
  "page": 1,
  "limit": 50,
  "hash": "string"
}
```

**Response**:
```json
{
  "transactions": [
    {
      "tran_id": "string",
      "status": 0,
      "amount": "100.00",
      "currency": "USD",
      "payment_date": "2024-01-01 12:00:00"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

## Payment Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 0 | SUCCESS | Payment completed successfully |
| 1 | CANCELLED | Payment cancelled by user |
| 2 | DECLINED | Payment declined by bank/issuer |
| 3 | ERROR | Payment processing error |
| 4 | PENDING | Payment is still processing (rare) |

## Webhook/Callback System

### Callback URL Configuration

ABA PayWay supports two methods for receiving payment notifications:

1. **Static Webhook**: Configured in your merchant profile (recommended for production)
2. **Dynamic Callback**: Sent with each transaction via `return_url` parameter

### Callback Parameters

When a payment is completed, ABA PayWay sends a POST request to your callback URL:

```json
{
  "tran_id": "string",      // Transaction ID
  "status": 0,              // Status code
  "apv": "100.00",          // Approved amount
  "merchant_id": "string",  // Your merchant ID
  "hash": "string"          // Verification signature
}
```

### Callback Verification

Always verify the callback signature:

```javascript
const dataToHash = tran_id + status + apv + merchant_id;
const expectedHash = crypto.createHmac('sha512', secretKey)
  .update(dataToHash)
  .digest('base64');

if (receivedHash !== expectedHash) {
  // Invalid callback - reject
}
```

## Error Handling

### Common Error Responses

```json
{
  "error": "Invalid signature",
  "code": "INVALID_HASH"
}
```

```json
{
  "error": "Transaction not found",
  "code": "TRANSACTION_NOT_FOUND"
}
```

```json
{
  "error": "Merchant not authorized",
  "code": "UNAUTHORIZED"
}
```

### Rate Limiting

- Status check API: 100 requests per minute
- Transaction list API: 10 requests per minute
- Callback endpoint: No limit (but implement your own protection)

## Best Practices

### 1. Status Checking Strategy

```javascript
// Check status immediately after payment initiation
// Then poll every 30 seconds for up to 5 minutes
// Finally, rely on callbacks for final confirmation

const checkPaymentStatus = async (transactionId) => {
  const maxAttempts = 10;
  const interval = 30000; // 30 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkTransactionStatus(transactionId);
    
    if (status.status !== 'pending') {
      return status; // Final status received
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  // Timeout - rely on callback
  return { status: 'timeout' };
};
```

### 2. Callback Handling

```javascript
// Always respond quickly to callbacks
app.post('/aba-callback', async (req, res) => {
  try {
    // Verify signature first
    if (!verifySignature(req.body)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }
    
    // Process asynchronously
    processPaymentCallback(req.body);
    
    // Respond immediately
    res.json({ status: 'received' });
  } catch (error) {
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

### 3. Reconciliation

```javascript
// Daily reconciliation process
const reconcilePayments = async (date) => {
  const transactions = await getTransactionList(date);
  
  for (const transaction of transactions) {
    const localOrder = await findOrderByTransactionId(transaction.tran_id);
    
    if (localOrder.status !== transaction.status) {
      await updateOrderStatus(localOrder.id, transaction.status);
      await logStatusDiscrepancy(localOrder.id, transaction);
    }
  }
};
```

## Integration Checklist

- [ ] Implement status check API endpoint
- [ ] Set up callback URL handling
- [ ] Add signature verification
- [ ] Implement status polling for pending payments
- [ ] Set up daily reconciliation
- [ ] Add error handling and retry logic
- [ ] Configure monitoring and alerts
- [ ] Test with sandbox environment
- [ ] Validate production webhook URL
- [ ] Set up logging and audit trail

## Support Resources

- **Developer Documentation**: https://developer.payway.com.kh
- **Sandbox Registration**: https://sandbox.payway.com.kh/register-sandbox/
- **Technical Support**: Contact ABA Bank merchant support
- **Production Credentials**: paywaysales@ababank.com

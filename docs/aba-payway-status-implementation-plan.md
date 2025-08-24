# ABA PayWay Payment Status Implementation Plan

## Phase 1: Enhanced Database Schema & Types

### 1.1 Update Order Model Schema

**File**: `lib/db/models/order.model.ts`

```typescript
// Add to existing Order schema
const orderSchema = new Schema({
  // ... existing fields ...
  
  // Enhanced ABA PayWay tracking
  abaPaymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  abaTransactionId: String,
  abaStatusCode: Number,
  abaLastStatusCheck: Date,
  abaCallbackReceived: { type: Boolean, default: false },
  abaStatusHistory: [{
    status: String,
    statusCode: Number,
    timestamp: { type: Date, default: Date.now },
    source: { type: String, enum: ['callback', 'api_check', 'manual'] },
    details: String
  }]
});
```

### 1.2 Update TypeScript Types

**File**: `types/aba-payway.ts`

```typescript
// Add new interfaces
export interface PaymentStatusHistoryEntry {
  status: string;
  statusCode: number;
  timestamp: Date;
  source: 'callback' | 'api_check' | 'manual';
  details?: string;
}

export interface ABAPayWayStatusCheckRequest {
  tran_id: string;
  merchant_id: string;
}

export interface ABAPayWayStatusCheckResponse {
  tran_id: string;
  status: number;
  amount: string;
  currency: string;
  payment_date?: string;
  description?: string;
}
```

## Phase 2: Check Transaction API Implementation

### 2.1 Create Status Check Service

**File**: `lib/aba-payway-status.ts`

```typescript
import { ABAPayWayStatusCheckRequest, ABAPayWayStatusCheckResponse } from '@/types/aba-payway';

export class ABAPayWayStatusService {
  private config: ABAPayWayConfig;

  constructor() {
    this.config = abaPayWayService.getConfig();
  }

  async checkTransactionStatus(transactionId: string): Promise<ABAPayWayStatusCheckResponse> {
    const requestData: ABAPayWayStatusCheckRequest = {
      tran_id: transactionId,
      merchant_id: this.config.merchantId
    };

    // Generate hash for status check
    const hash = this.generateStatusCheckHash(requestData);
    
    const response = await fetch(`${this.config.baseUrl}/api/payment-gateway/v1/payments/check-transaction-2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestData,
        hash
      })
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private generateStatusCheckHash(data: ABAPayWayStatusCheckRequest): string {
    const dataToHash = data.tran_id + data.merchant_id;
    return Buffer.from(
      crypto.createHmac('sha512', this.config.apiKey)
        .update(dataToHash)
        .digest()
    ).toString('base64');
  }
}
```

### 2.2 Create Status Check API Endpoint

**File**: `app/api/aba-payway/check-status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ABAPayWayStatusService } from '@/lib/aba-payway-status';
import { getOrderById } from '@/lib/actions/order.actions';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();
    
    await connectToDatabase();
    const order = await getOrderById(orderId);
    
    if (!order || order.user.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.abaMerchantRefNo) {
      return NextResponse.json({ error: 'No ABA transaction found' }, { status: 400 });
    }

    const statusService = new ABAPayWayStatusService();
    const statusResult = await statusService.checkTransactionStatus(order.abaMerchantRefNo);

    // Update order with latest status
    const statusEntry = {
      status: statusResult.status === 0 ? 'completed' : 'failed',
      statusCode: statusResult.status,
      timestamp: new Date(),
      source: 'api_check' as const,
      details: statusResult.description || ''
    };

    await Order.findByIdAndUpdate(orderId, {
      $set: {
        abaStatusCode: statusResult.status,
        abaLastStatusCheck: new Date(),
        abaPaymentStatus: statusEntry.status
      },
      $push: {
        abaStatusHistory: statusEntry
      }
    });

    return NextResponse.json({
      success: true,
      status: statusResult.status,
      paymentStatus: statusEntry.status,
      lastChecked: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ABA PayWay] Status check error:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
```

## Phase 3: Enhanced Callback Handler

### 3.1 Update Callback Route

**File**: `app/api/aba-payway/callback/route.ts` (Enhancement)

```typescript
// Add to existing callback handler after status processing
const statusEntry = {
  status: statusCode === ABA_PAYWAY_STATUS_CODES.SUCCESS ? 'completed' : 'failed',
  statusCode: statusCode,
  timestamp: new Date(),
  source: 'callback' as const,
  details: `Callback received with status ${statusCode}`
};

// Update order with enhanced tracking
await Order.findByIdAndUpdate(order._id, {
  $set: {
    abaPaymentStatus: statusEntry.status,
    abaStatusCode: statusCode,
    abaCallbackReceived: true,
    abaLastStatusCheck: new Date(),
    // ... existing payment updates
  },
  $push: {
    abaStatusHistory: statusEntry
  }
});
```

## Phase 4: Frontend Status Components

### 4.1 Payment Status Display Component

**File**: `components/aba-payway/payment-status.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PaymentStatusProps {
  orderId: string;
  initialStatus?: string;
  showRefresh?: boolean;
}

export function PaymentStatus({ orderId, initialStatus, showRefresh = true }: PaymentStatusProps) {
  const [status, setStatus] = useState(initialStatus || 'pending');
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/aba-payway/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data.paymentStatus);
        setLastChecked(data.lastChecked);
      }
    } catch (error) {
      console.error('Status check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'cancelled': return <XCircle className="h-5 w-5 text-gray-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Payment Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge className={getStatusColor()}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          
          {showRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          )}
        </div>
        
        {lastChecked && (
          <p className="text-sm text-gray-500 mt-2">
            Last checked: {new Date(lastChecked).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 4.2 Update Order Details Page

**File**: `app/[locale]/account/orders/[id]/page.tsx` (Enhancement)

```typescript
import { PaymentStatus } from '@/components/aba-payway/payment-status';

// Add to order details page
{order.paymentMethod === 'ABA PayWay' && (
  <PaymentStatus 
    orderId={order._id} 
    initialStatus={order.abaPaymentStatus}
  />
)}
```

## Phase 5: Background Status Monitoring

### 5.1 Create Status Monitoring Service

**File**: `lib/services/payment-monitor.ts`

```typescript
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/db/models/order.model';
import { ABAPayWayStatusService } from '@/lib/aba-payway-status';

export class PaymentMonitorService {
  private statusService = new ABAPayWayStatusService();

  async monitorPendingPayments() {
    await connectToDatabase();
    
    // Find orders with pending ABA PayWay payments older than 5 minutes
    const pendingOrders = await Order.find({
      paymentMethod: 'ABA PayWay',
      abaPaymentStatus: { $in: ['pending', 'processing'] },
      createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minutes ago
      abaLastStatusCheck: { $lt: new Date(Date.now() - 2 * 60 * 1000) } // Last checked > 2 minutes ago
    });

    for (const order of pendingOrders) {
      try {
        await this.checkAndUpdateOrderStatus(order._id);
      } catch (error) {
        console.error(`Failed to check status for order ${order._id}:`, error);
      }
    }
  }

  private async checkAndUpdateOrderStatus(orderId: string) {
    const order = await Order.findById(orderId);
    if (!order?.abaMerchantRefNo) return;

    const statusResult = await this.statusService.checkTransactionStatus(order.abaMerchantRefNo);
    
    const statusEntry = {
      status: statusResult.status === 0 ? 'completed' : 'failed',
      statusCode: statusResult.status,
      timestamp: new Date(),
      source: 'api_check' as const,
      details: 'Automated status check'
    };

    await Order.findByIdAndUpdate(orderId, {
      $set: {
        abaStatusCode: statusResult.status,
        abaLastStatusCheck: new Date(),
        abaPaymentStatus: statusEntry.status
      },
      $push: {
        abaStatusHistory: statusEntry
      }
    });
  }
}
```

## Implementation Timeline

### Week 1: Core Infrastructure
- [ ] Update database schema and types
- [ ] Implement Check Transaction API
- [ ] Enhance callback handler
- [ ] Create status check endpoint

### Week 2: Frontend & UX
- [ ] Build payment status components
- [ ] Update order pages
- [ ] Add manual refresh functionality
- [ ] Implement real-time updates

### Week 3: Monitoring & Reliability
- [ ] Background status monitoring
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Testing and validation

### Week 4: Polish & Documentation
- [ ] Admin dashboard enhancements
- [ ] Comprehensive testing
- [ ] Documentation updates
- [ ] Production deployment

## Success Metrics

- **Callback Success Rate**: >99%
- **Status Check Response Time**: <2 seconds
- **Payment Confirmation Time**: <30 seconds
- **False Positive Rate**: <0.1%
- **System Uptime**: >99.9%

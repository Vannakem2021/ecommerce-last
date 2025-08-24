#!/usr/bin/env node

/**
 * Implementation script for ABA PayWay Payment Status System
 * This script helps implement the enhanced payment status tracking
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 ABA PayWay Payment Status System Implementation\n');

// File templates for implementation
const templates = {
  // Enhanced Order Schema
  orderModelUpdate: `
// Add these fields to your existing Order schema in lib/db/models/order.model.ts

// Enhanced ABA PayWay tracking fields
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
`,

  // TypeScript types
  typeDefinitions: `
// Add these interfaces to types/aba-payway.ts

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
`,

  // Status Service
  statusService: `
// Create lib/aba-payway-status.ts

import crypto from 'crypto';
import { abaPayWayService } from './aba-payway';

export class ABAPayWayStatusService {
  private config: any;

  constructor() {
    this.config = {
      merchantId: process.env.PAYWAY_MERCHANT_ID || '',
      apiKey: process.env.PAYWAY_SECRET_KEY || '',
      baseUrl: process.env.PAYWAY_BASE_URL || 'https://checkout-sandbox.payway.com.kh'
    };
  }

  async checkTransactionStatus(transactionId: string) {
    const requestData = {
      tran_id: transactionId,
      merchant_id: this.config.merchantId
    };

    const hash = this.generateStatusCheckHash(requestData);
    
    const response = await fetch(\`\${this.config.baseUrl}/api/payment-gateway/v1/payments/check-transaction-2\`, {
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
      throw new Error(\`Status check failed: \${response.statusText}\`);
    }

    return await response.json();
  }

  private generateStatusCheckHash(data: any): string {
    const dataToHash = data.tran_id + data.merchant_id;
    return Buffer.from(
      crypto.createHmac('sha512', this.config.apiKey)
        .update(dataToHash)
        .digest()
    ).toString('base64');
  }
}

export const abaPayWayStatusService = new ABAPayWayStatusService();
`,

  // API Route
  statusCheckRoute: `
// Create app/api/aba-payway/check-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { abaPayWayStatusService } from '@/lib/aba-payway-status';
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

    const statusResult = await abaPayWayStatusService.checkTransactionStatus(order.abaMerchantRefNo);

    const statusEntry = {
      status: statusResult.status === 0 ? 'completed' : 'failed',
      statusCode: statusResult.status,
      timestamp: new Date(),
      source: 'api_check',
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
`,

  // React Component
  statusComponent: `
// Create components/aba-payway/payment-status.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface PaymentStatusProps {
  orderId: string;
  initialStatus?: string;
}

export function PaymentStatus({ orderId, initialStatus = 'pending' }: PaymentStatusProps) {
  const [status, setStatus] = useState(initialStatus);
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
`
};

function createImplementationGuide() {
  const guide = `
# ABA PayWay Payment Status Implementation Guide

## Quick Start Implementation

Follow these steps to implement the enhanced payment status system:

### Step 1: Update Database Schema
${templates.orderModelUpdate}

### Step 2: Add TypeScript Types
${templates.typeDefinitions}

### Step 3: Create Status Service
${templates.statusService}

### Step 4: Create API Route
${templates.statusCheckRoute}

### Step 5: Create React Component
${templates.statusComponent}

### Step 6: Update Order Pages

Add this to your order details page:

\`\`\`tsx
import { PaymentStatus } from '@/components/aba-payway/payment-status';

// In your order details component
{order.paymentMethod === 'ABA PayWay' && (
  <PaymentStatus 
    orderId={order._id} 
    initialStatus={order.abaPaymentStatus}
  />
)}
\`\`\`

## Testing

1. Create a test order with ABA PayWay
2. Check the payment status component appears
3. Test the refresh functionality
4. Verify status updates in the database

## Next Steps

1. Implement background monitoring
2. Add email notifications
3. Create admin dashboard
4. Set up monitoring alerts

## Documentation

- Full implementation plan: docs/aba-payway-status-implementation-plan.md
- System overview: docs/aba-payway-payment-status-system.md
`;

  return guide;
}

// Generate the implementation guide
const guide = createImplementationGuide();

// Write to file
const outputPath = path.join(process.cwd(), 'PAYMENT_STATUS_IMPLEMENTATION.md');
fs.writeFileSync(outputPath, guide);

console.log('✅ Implementation guide created: PAYMENT_STATUS_IMPLEMENTATION.md');
console.log('\n📋 Next Steps:');
console.log('1. Review the implementation plan in docs/aba-payway-status-implementation-plan.md');
console.log('2. Follow the quick start guide in PAYMENT_STATUS_IMPLEMENTATION.md');
console.log('3. Test the implementation with sandbox payments');
console.log('4. Monitor payment status updates in real-time');

console.log('\n🎯 Key Benefits:');
console.log('- Real-time payment status tracking');
console.log('- Automatic status verification');
console.log('- Enhanced user experience');
console.log('- Robust error handling');
console.log('- Comprehensive audit trail');

console.log('\n🔧 Implementation Priority:');
console.log('1. Database schema updates (Critical)');
console.log('2. Status check API (High)');
console.log('3. Frontend components (Medium)');
console.log('4. Background monitoring (Low)');

console.log('\n✨ Ready to implement! Check the generated files for detailed instructions.');

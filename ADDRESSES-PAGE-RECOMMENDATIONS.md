# Address Page - Auto-Save from Checkout Recommendations

## Current Situation

The `/account/addresses` page currently:
- ❌ Shows only ONE manually added address (user.address)
- ❌ Requires manual add/edit via dialog
- ❌ Does NOT automatically save addresses from checkout
- ❌ Orders save shippingAddress but don't populate user addresses

## Requested Changes

1. ✅ **Auto-save addresses from checkout** - When users enter address during checkout, save it automatically
2. ✅ **Display all addresses from orders** - Show unique addresses used in past orders
3. ✅ **Remove manual add option** - Since addresses come from checkout automatically
4. ✅ **Read-only display** - Just show the addresses, don't allow editing

## Proposed Solution

### Option 1: Fetch Addresses from Orders (Recommended) ✅

**Approach:**
- Query all user's orders
- Extract unique shippingAddresses
- Display them in a read-only list
- Show which address was used most recently
- Show order count per address

**Pros:**
- ✅ No database schema changes needed
- ✅ Automatic - addresses saved when orders placed
- ✅ Simple to implement
- ✅ Shows address usage history

**Cons:**
- ⚠️ Slightly slower query (need to fetch all orders)
- ⚠️ No way to delete old addresses
- ⚠️ Duplicates possible if user types address differently

**Implementation:**

1. Create action to get addresses from orders:
```typescript
// lib/actions/order.actions.ts
export async function getUserAddressesFromOrders(userId: string) {
  await connectToDatabase()
  
  const orders = await Order.find({ user: userId })
    .select('shippingAddress createdAt')
    .sort({ createdAt: -1 })
    .lean()
  
  // Group addresses and count usage
  const addressMap = new Map()
  
  orders.forEach(order => {
    const addr = order.shippingAddress
    const key = `${addr.fullName}-${addr.phone}-${addr.houseNumber}-${addr.communeCode}`
    
    if (addressMap.has(key)) {
      const existing = addressMap.get(key)
      existing.orderCount++
      existing.lastUsed = order.createdAt
    } else {
      addressMap.set(key, {
        address: addr,
        orderCount: 1,
        lastUsed: order.createdAt,
        firstUsed: order.createdAt
      })
    }
  })
  
  return Array.from(addressMap.values())
}
```

2. Update addresses page:
```typescript
// Display addresses from orders
<div className="space-y-4">
  {addresses.map((item, index) => (
    <Card key={index}>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Address {index + 1}</CardTitle>
          <Badge>Used {item.orderCount} time{item.orderCount > 1 ? 's' : ''}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <AddressDisplay address={item.address} />
        <div className="mt-4 text-sm text-muted-foreground">
          Last used: {formatDate(item.lastUsed)}
        </div>
      </CardContent>
    </Card>
  ))}
  
  {addresses.length === 0 && (
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-muted-foreground">No addresses saved yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Your address will be saved automatically when you place an order
        </p>
        <Link href="/search">
          <Button className="mt-4">Start Shopping</Button>
        </Link>
      </CardContent>
    </Card>
  )}
</div>
```

### Option 2: Save to User Profile During Checkout

**Approach:**
- Modify `createOrder` to also save address to user.address
- Support multiple addresses array on user model
- Allow deleting/editing from addresses page

**Pros:**
- ✅ Faster queries (no need to scan orders)
- ✅ Can delete old addresses
- ✅ Can manually edit addresses

**Cons:**
- ❌ Requires database schema changes
- ❌ More complex implementation
- ❌ Need migration for existing users

## Recommended Implementation (Option 1)

### Step 1: Create Action
```typescript
// lib/actions/order.actions.ts
export async function getUserAddressesFromOrders(userId: string) {
  try {
    await connectToDatabase()
    
    const orders = await Order.find({ user: userId })
      .select('shippingAddress createdAt')
      .sort({ createdAt: -1 })
      .lean()
    
    if (!orders || orders.length === 0) {
      return { success: true, data: [] }
    }
    
    // Group addresses by unique key
    const addressMap = new Map<string, {
      address: ShippingAddress
      orderCount: number
      lastUsed: Date
      firstUsed: Date
    }>()
    
    orders.forEach((order) => {
      if (!order.shippingAddress) return
      
      const addr = order.shippingAddress
      // Create unique key based on address details
      const key = [
        addr.fullName?.trim().toLowerCase(),
        addr.phone?.trim(),
        addr.houseNumber?.trim().toLowerCase(),
        addr.street?.trim().toLowerCase(),
        addr.communeCode?.trim()
      ].filter(Boolean).join('-')
      
      if (addressMap.has(key)) {
        const existing = addressMap.get(key)!
        existing.orderCount++
        // Keep track of last used (most recent)
        if (new Date(order.createdAt!) > new Date(existing.lastUsed)) {
          existing.lastUsed = order.createdAt!
        }
      } else {
        addressMap.set(key, {
          address: addr,
          orderCount: 1,
          lastUsed: order.createdAt!,
          firstUsed: order.createdAt!
        })
      }
    })
    
    // Convert to array and sort by last used (most recent first)
    const addresses = Array.from(addressMap.values())
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    
    return { success: true, data: addresses }
  } catch (error) {
    return { success: false, message: formatError(error), data: [] }
  }
}
```

### Step 2: Update Page Component
```typescript
// app/[locale]/(root)/account/addresses/page.tsx
import { getUserAddressesFromOrders } from '@/lib/actions/order.actions'

export default async function AddressesPageWrapper() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const result = await getUserAddressesFromOrders(session.user.id)
  const addresses = result.data || []

  return <AddressesPage addresses={addresses} />
}
```

### Step 3: Update UI Component
```typescript
// app/[locale]/(root)/account/addresses/addresses-page.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddressDisplay } from '@/components/shared/address/address-display'
import { formatDateTime } from '@/lib/utils'
import { MapPin, Package, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

interface AddressWithMeta {
  address: ShippingAddress
  orderCount: number
  lastUsed: Date
  firstUsed: Date
}

interface AddressesPageProps {
  addresses: AddressWithMeta[]
}

export default function AddressesPage({ addresses }: AddressesPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">My Addresses</h1>
        <p className="text-muted-foreground mt-1">
          Addresses from your orders
        </p>
      </div>

      {/* Addresses List */}
      {addresses.length > 0 ? (
        <div className="grid gap-4">
          {addresses.map((item, index) => (
            <Card key={index} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <CardTitle className="text-lg">
                      {index === 0 ? 'Most Recent Address' : `Address ${index + 1}`}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {index === 0 && (
                      <Badge className="bg-green-600">Most Recent</Badge>
                    )}
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {item.orderCount} order{item.orderCount > 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AddressDisplay address={item.address} />
                <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between gap-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Last used:</span> {formatDateTime(item.lastUsed).dateTime}
                  </div>
                  {item.firstUsed !== item.lastUsed && (
                    <div>
                      <span className="font-medium">First used:</span> {formatDateTime(item.firstUsed).dateTime}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-base font-medium mb-1">No addresses saved yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Your shipping address will be saved automatically when you place an order
              </p>
              <Link href="/search">
                <Button className="inline-flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Start Shopping
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      {addresses.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <div className="text-blue-600 mt-0.5">
                ℹ️
              </div>
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">About Your Addresses</p>
                <p>
                  These addresses were automatically saved from your orders. To add or update an address, 
                  simply place a new order with the desired shipping address.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

## Benefits

1. ✅ **Automatic** - No manual data entry needed
2. ✅ **Historical** - See all addresses you've used
3. ✅ **Usage stats** - Know which address you use most
4. ✅ **Read-only** - No accidental edits/deletions
5. ✅ **Simple** - No complex address management UI
6. ✅ **Trustworthy** - Shows actual addresses from real orders

## Testing Checklist

- [ ] User with no orders sees empty state
- [ ] User with 1 order sees 1 address
- [ ] User with multiple orders to same address sees order count
- [ ] User with orders to different addresses sees all unique addresses
- [ ] Most recent address is shown first
- [ ] Address details display correctly
- [ ] Usage stats (order count) are accurate
- [ ] Dates display correctly
- [ ] Mobile responsive layout works
- [ ] Empty state shows correct message
- [ ] Link to shopping works

## Migration Notes

No database migration needed! This solution:
- ✅ Uses existing order data
- ✅ No schema changes
- ✅ Works for all users immediately
- ✅ No data migration required

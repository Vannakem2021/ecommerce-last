'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddressDisplay } from '@/components/shared/address/address-display'
import { formatDateTime } from '@/lib/utils'
import { MapPin, Package, ShoppingBag, Star } from 'lucide-react'
import Link from 'next/link'
import { ShippingAddress } from '@/types'
import { setDefaultAddress } from '@/lib/actions/user.actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface AddressWithMeta {
  address: ShippingAddress
  orderCount: number
  lastUsed: Date
  firstUsed: Date
  key: string
  isDefault: boolean
}

interface AddressesPageProps {
  addresses: AddressWithMeta[]
  userId: string
}

export default function AddressesPage({ addresses, userId }: AddressesPageProps) {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({})
  const { toast } = useToast()
  const router = useRouter()

  const handleSetDefault = async (address: ShippingAddress, key: string) => {
    setLoadingStates(prev => ({ ...prev, [`default-${key}`]: true }))
    
    const result = await setDefaultAddress(address)
    
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      })
      router.refresh()
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      })
    }
    
    setLoadingStates(prev => ({ ...prev, [`default-${key}`]: false }))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Addresses</h1>
        <p className="text-sm text-muted-foreground">
          {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
        </p>
      </div>

      {/* Addresses List */}
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((item, index) => (
            <Card key={item.key || index} className={`transition-colors ${item.isDefault ? 'border-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Header with badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.isDefault && (
                        <Badge variant="default" className="gap-1">
                          <Star className="w-3 h-3" />
                          Default
                        </Badge>
                      )}
                      <Badge variant="outline" className="gap-1">
                        <Package className="w-3 h-3" />
                        {item.orderCount}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(item.lastUsed).dateTime}
                      </span>
                    </div>
                    {!item.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(item.address, item.key)}
                        disabled={loadingStates[`default-${item.key}`]}
                        className="h-8 px-2 text-xs"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {loadingStates[`default-${item.key}`] ? 'Setting...' : 'Set Default'}
                      </Button>
                    )}
                  </div>
                  
                  {/* Address Details */}
                  <AddressDisplay address={item.address} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium mb-1">No addresses yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Addresses are saved automatically when you place an order
            </p>
            <Link href="/search">
              <Button size="sm" variant="outline">
                <ShoppingBag className="w-3 h-3 mr-2" />
                Start Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Info Text */}
      {addresses.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Addresses from your orders • Set one as default for quick checkout
        </p>
      )}
    </div>
  )
}

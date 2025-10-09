'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddressDisplay } from '@/components/shared/address/address-display'
import { formatDateTime } from '@/lib/utils'
import { MapPin, Plus, Star, Edit, Trash2, Loader2 } from 'lucide-react'
import { ShippingAddress } from '@/types'
import { setAddressAsDefault, deleteAddress } from '@/lib/actions/address.actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { AddressFormDialog } from '@/components/shared/address/address-form-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AddressItem extends ShippingAddress {
  _id: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface AddressesPageProps {
  addresses: AddressItem[]
}

export default function AddressesPage({ addresses }: AddressesPageProps) {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({})
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null)
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleSetDefault = async (addressId: string) => {
    setLoadingStates(prev => ({ ...prev, [`default-${addressId}`]: true }))
    
    const result = await setAddressAsDefault(addressId)
    
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
    
    setLoadingStates(prev => ({ ...prev, [`default-${addressId}`]: false }))
  }

  const handleDelete = async (addressId: string) => {
    setLoadingStates(prev => ({ ...prev, [`delete-${addressId}`]: true }))
    
    const result = await deleteAddress(addressId)
    
    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      })
      setDeletingAddressId(null)
      router.refresh()
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      })
    }
    
    setLoadingStates(prev => ({ ...prev, [`delete-${addressId}`]: false }))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Addresses</h1>
          <p className="text-sm text-muted-foreground">
            {addresses.length} saved {addresses.length === 1 ? 'address' : 'addresses'}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </div>

      {/* Addresses List */}
      {addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card key={address._id} className={`transition-colors ${address.isDefault ? 'border-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Header with badges and actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {address.isDefault && (
                        <Badge variant="default" className="gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Default
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Added {formatDateTime(address.createdAt).dateOnly}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[
                        !address.isDefault && (
                          <Button
                            key="set-default"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(address._id)}
                            disabled={loadingStates[`default-${address._id}`]}
                            className="h-8 px-2 text-xs"
                          >
                            {loadingStates[`default-${address._id}`] ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Star className="w-3 h-3 mr-1" />
                                Set Default
                              </>
                            )}
                          </Button>
                        ),
                        <Button
                          key="edit"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAddress(address)}
                          className="h-8 px-2 text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>,
                        <Button
                          key="delete"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingAddressId(address._id)}
                          className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      ]}
                    </div>
                  </div>
                  
                  {/* Address Details */}
                  <AddressDisplay address={address} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium mb-1">No addresses yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add your delivery address to make checkout faster
            </p>
            <Button onClick={() => setShowAddDialog(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Text */}
      {addresses.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Manage your delivery addresses • Set one as default for quick checkout
        </p>
      )}

      {/* Add Address Dialog */}
      <AddressFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        mode="add"
        totalAddresses={addresses.length}
      />

      {/* Edit Address Dialog */}
      {editingAddress && (
        <AddressFormDialog
          open={!!editingAddress}
          onOpenChange={(open) => !open && setEditingAddress(null)}
          mode="edit"
          addressId={editingAddress._id}
          initialData={editingAddress}
          isDefault={editingAddress.isDefault}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAddressId} onOpenChange={(open) => !open && setDeletingAddressId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAddressId && handleDelete(deletingAddressId)}
              disabled={deletingAddressId ? loadingStates[`delete-${deletingAddressId}`] : false}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAddressId && loadingStates[`delete-${deletingAddressId}`] ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

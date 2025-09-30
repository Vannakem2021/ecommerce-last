'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { CambodiaAddressSchema } from '@/lib/validator'
import { CambodiaAddress } from '@/types'
import { CambodiaAddressForm } from '@/components/shared/address/cambodia-address-form'
import { AddressDisplay, isAddressComplete } from '@/components/shared/address/address-display'
import { updateUserAddress } from '@/lib/actions/user.actions'
import { IUser } from '@/lib/db/models/user.model'

interface AddressesPageProps {
  user: IUser
}

export default function AddressesPage({ user }: AddressesPageProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<CambodiaAddress>({
    resolver: zodResolver(CambodiaAddressSchema),
    defaultValues: {
      fullName: user.address?.fullName || '',
      phone: user.address?.phone || '',
      provinceId: (user.address && 'provinceId' in user.address) ? user.address.provinceId : undefined,
      districtId: (user.address && 'districtId' in user.address) ? user.address.districtId : undefined,
      communeCode: (user.address && 'communeCode' in user.address) ? user.address.communeCode : '',
      houseNumber: (user.address && 'houseNumber' in user.address) ? user.address.houseNumber : '',
      street: user.address?.street || '',
      postalCode: user.address?.postalCode || '',
      provinceName: (user.address && 'provinceName' in user.address) ? user.address.provinceName : '',
      districtName: (user.address && 'districtName' in user.address) ? user.address.districtName : '',
      communeName: (user.address && 'communeName' in user.address) ? user.address.communeName : '',
    },
  })

  const onSubmit = async (data: CambodiaAddress) => {
    try {
      setIsLoading(true)
      await updateUserAddress(user._id, data)
      toast({
        title: 'Success',
        description: 'Address updated successfully',
      })
      setIsDialogOpen(false)
      // Refresh the page to show updated data
      window.location.reload()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update address',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const hasAddress = user.address && isAddressComplete(user.address as CambodiaAddress)

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Addresses</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              {hasAddress ? 'Edit Address' : 'Add Address'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {hasAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <CambodiaAddressForm control={form.control} setValue={form.setValue} />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Address'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {hasAddress ? (
          <Card>
            <CardHeader>
              <CardTitle>Default Address</CardTitle>
            </CardHeader>
            <CardContent>
              <AddressDisplay address={user.address as CambodiaAddress} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No addresses saved yet</p>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add Your First Address</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <CambodiaAddressForm control={form.control} setValue={form.setValue} />
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? 'Saving...' : 'Save Address'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

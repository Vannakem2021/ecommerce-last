'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CambodiaAddressSchema } from '@/lib/validator'
import { ShippingAddress } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { CambodiaAddressForm } from './cambodia-address-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { addAddress, updateAddress } from '@/lib/actions/address.actions'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface AddressFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  addressId?: string
  initialData?: ShippingAddress
  isDefault?: boolean
  totalAddresses?: number
}

const emptyAddressValues: ShippingAddress = {
  fullName: '',
  phone: '',
  provinceId: '',
  districtId: '',
  communeCode: '',
  houseNumber: '',
  street: '',
  postalCode: '',
  provinceName: '',
  districtName: '',
  communeName: '',
}

export function AddressFormDialog({
  open,
  onOpenChange,
  mode,
  addressId,
  initialData,
  isDefault = false,
  totalAddresses = 0,
}: AddressFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isFirstAddress = mode === 'add' && totalAddresses === 0
  const [setAsDefault, setSetAsDefault] = useState(isDefault || isFirstAddress)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<ShippingAddress>({
    resolver: zodResolver(CambodiaAddressSchema),
    defaultValues: initialData || emptyAddressValues,
  })

  // Reset form when dialog opens/closes or mode changes
  useEffect(() => {
    if (open) {
      const isFirst = mode === 'add' && totalAddresses === 0
      form.reset(initialData || emptyAddressValues)
      setSetAsDefault(isDefault || isFirst)
    }
  }, [open, mode, initialData, isDefault, totalAddresses, form])

  const onSubmit = async (data: ShippingAddress) => {
    setIsSubmitting(true)

    try {
      let result

      if (mode === 'add') {
        result = await addAddress(data, setAsDefault)
      } else if (mode === 'edit' && addressId) {
        result = await updateAddress(addressId, data)
      } else {
        throw new Error('Invalid mode or missing addressId')
      }

      if (result.success) {
        toast({
          title: 'Success',
          description: result.message,
        })
        onOpenChange(false)
        form.reset()
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Address' : 'Edit Address'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Fill in the details below to add a new delivery address.'
              : 'Update the address details below.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CambodiaAddressForm
              key={`address-form-${mode}-${addressId || 'new'}`}
              control={form.control}
              setValue={form.setValue}
              disabled={isSubmitting}
            />

            {mode === 'add' && !isFirstAddress && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="setAsDefault"
                  checked={setAsDefault}
                  onCheckedChange={(checked) => setSetAsDefault(checked as boolean)}
                />
                <Label
                  htmlFor="setAsDefault"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Set as default address
                </Label>
              </div>
            )}
            
            {mode === 'add' && isFirstAddress && (
              <div className="text-sm text-muted-foreground pt-2">
                This will be set as your default address
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'add' ? 'Add Address' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

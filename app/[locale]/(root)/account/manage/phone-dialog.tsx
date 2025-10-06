'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { updatePhoneNumber } from '@/lib/actions/user.actions'

const PhoneSchema = z.object({
  phone: z.string().min(8, 'Phone number must be at least 8 digits').max(20, 'Phone number is too long'),
})

interface PhoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPhone?: string
}

export function PhoneDialog({ open, onOpenChange, currentPhone }: PhoneDialogProps) {
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof PhoneSchema>>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: {
      phone: currentPhone || '',
    },
  })

  async function onSubmit(values: z.infer<typeof PhoneSchema>) {
    const result = await updatePhoneNumber(values.phone)
    
    if (!result.success) {
      toast({
        variant: 'destructive',
        description: result.message,
      })
      return
    }

    toast({
      description: result.message,
    })

    onOpenChange(false)
    form.reset({ phone: result.data?.phone || '' })
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentPhone ? 'Edit' : 'Add'} Phone Number</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

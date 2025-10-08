/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ISettingInput } from '@/types'
import { DollarSign, CreditCard, Truck, TrashIcon } from 'lucide-react'
import React, { useEffect } from 'react'
import { useFieldArray, UseFormReturn } from 'react-hook-form'

export default function CommerceForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const { control, watch, setValue } = form

  // Payment Methods
  const { fields: paymentFields, append: appendPayment, remove: removePayment } = useFieldArray({
    control: form.control,
    name: 'availablePaymentMethods',
  })

  const availablePaymentMethods = watch('availablePaymentMethods')
  const defaultPaymentMethod = watch('defaultPaymentMethod')

  useEffect(() => {
    const validCodes = availablePaymentMethods.map((pm) => pm.name)
    if (!validCodes.includes(defaultPaymentMethod)) {
      setValue('defaultPaymentMethod', '')
    }
  }, [JSON.stringify(availablePaymentMethods)])

  // Delivery Dates
  const { fields: deliveryFields, append: appendDelivery, remove: removeDelivery } = useFieldArray({
    control: form.control,
    name: 'availableDeliveryDates',
  })

  const availableDeliveryDates = watch('availableDeliveryDates')
  const defaultDeliveryDate = watch('defaultDeliveryDate')

  useEffect(() => {
    const validCodes = availableDeliveryDates.map((dd) => dd.name)
    if (!validCodes.includes(defaultDeliveryDate)) {
      setValue('defaultDeliveryDate', '')
    }
  }, [JSON.stringify(availableDeliveryDates)])

  return (
    <div id={id} className='space-y-6'>
      {/* Card Grid Layout */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        
        {/* Card 1: Currency Settings */}
        <Card className='hover:border-primary/50 transition-colors'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <DollarSign className='h-5 w-5 text-primary' />
              <CardTitle className='text-base'>Currency Settings</CardTitle>
            </div>
            <CardDescription className='text-xs'>Configure base and conversion rates</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* USD Currency - Fixed */}
            <div className='space-y-2'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>USD (Base Currency)</h3>
              <div className='grid grid-cols-2 gap-2'>
                <FormField
                  control={control}
                  name={`availableCurrencies.0.code`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>Code</FormLabel>
                      <FormControl>
                        <Input {...field} value="USD" disabled className='text-xs h-8' />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`availableCurrencies.0.symbol`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>Symbol</FormLabel>
                      <FormControl>
                        <Input {...field} value="$" disabled className='text-xs h-8' />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* KHR Currency - Editable */}
            <div className='space-y-2'>
              <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>KHR (Khmer Riel)</h3>
              <div className='grid grid-cols-2 gap-2'>
                <FormField
                  control={control}
                  name={`availableCurrencies.1.code`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>Code</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="KHR" className='text-xs h-8' />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`availableCurrencies.1.symbol`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-xs'>Symbol</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} placeholder="៛" className='text-xs h-8' />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name={`availableCurrencies.1.convertRate`}
                  render={({ field }) => (
                    <FormItem className='col-span-2'>
                      <FormLabel className='text-xs'>Conversion Rate (1 USD = ? KHR)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="4100"
                          className='text-xs h-8'
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={control}
              name='defaultCurrency'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Default Currency</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder="Select default currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="KHR">KHR (៛)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Card 2: Payment Methods */}
        <Card className='hover:border-primary/50 transition-colors'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <CreditCard className='h-5 w-5 text-primary' />
              <CardTitle className='text-base'>Payment Methods</CardTitle>
            </div>
            <CardDescription className='text-xs'>Manage payment options and ABA PayWay</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Payment Methods List */}
            <div className='space-y-2'>
              {paymentFields.map((field, index) => (
                <div key={field.id} className='flex gap-2'>
                  <FormField
                    control={control}
                    name={`availablePaymentMethods.${index}.name`}
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        {index === 0 && <FormLabel className='text-xs'>Name</FormLabel>}
                        <FormControl>
                          <Input {...field} placeholder='Cash on Delivery' className='text-xs h-8' />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`availablePaymentMethods.${index}.commission`}
                    render={({ field }) => (
                      <FormItem className='w-24'>
                        {index === 0 && <FormLabel className='text-xs'>Fee %</FormLabel>}
                        <FormControl>
                          <Input {...field} placeholder='0' className='text-xs h-8' />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                  <div className='flex items-end'>
                    <Button
                      type='button'
                      disabled={paymentFields.length === 1}
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={() => removePayment(index)}
                    >
                      <TrashIcon className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-xs h-8'
                onClick={() => appendPayment({ name: '', commission: 0 })}
              >
                Add Payment Method
              </Button>
            </div>

            {/* Default Payment Method */}
            <FormField
              control={control}
              name='defaultPaymentMethod'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs'>Default Payment</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='Select default' />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePaymentMethods
                          .filter((x) => x.name)
                          .map((pm, index) => (
                            <SelectItem key={index} value={pm.name}>
                              {pm.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />

            {/* ABA PayWay Toggle */}
            <div className='border-t pt-3 space-y-3'>
              <FormField
                control={control}
                name="abaPayWay.enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className='text-xs font-medium'>ABA PayWay</FormLabel>
                      <FormDescription className='text-xs'>
                        Enable ABA PAY, KHQR, Cards
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {watch('abaPayWay.enabled') && (
                <>
                  <FormField
                    control={control}
                    name="abaPayWay.merchantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-xs'>Merchant ID</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Your merchant ID"
                            value={field.value || ""}
                            className='text-xs h-8'
                          />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="abaPayWay.sandboxMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className='text-xs font-medium'>Sandbox Mode</FormLabel>
                          <FormDescription className='text-xs'>
                            Testing environment
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Delivery Options - Full Width */}
        <Card className='hover:border-primary/50 transition-colors md:col-span-2'>
          <CardHeader className='pb-3'>
            <div className='flex items-center gap-2'>
              <Truck className='h-5 w-5 text-primary' />
              <CardTitle className='text-base'>Delivery Options</CardTitle>
            </div>
            <CardDescription className='text-xs'>Configure delivery dates and shipping prices</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Delivery Dates List */}
            <div className='space-y-2'>
              {deliveryFields.map((field, index) => (
                <div key={field.id} className='flex gap-2'>
                  <FormField
                    control={control}
                    name={`availableDeliveryDates.${index}.name`}
                    render={({ field }) => (
                      <FormItem className='flex-1'>
                        {index === 0 && <FormLabel className='text-xs'>Name</FormLabel>}
                        <FormControl>
                          <Input {...field} placeholder='Standard Delivery' className='text-xs h-8' />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`availableDeliveryDates.${index}.daysToDeliver`}
                    render={({ field }) => (
                      <FormItem className='w-20'>
                        {index === 0 && <FormLabel className='text-xs'>Days</FormLabel>}
                        <FormControl>
                          <Input {...field} placeholder='3' className='text-xs h-8' />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`availableDeliveryDates.${index}.shippingPrice`}
                    render={({ field }) => (
                      <FormItem className='w-24'>
                        {index === 0 && <FormLabel className='text-xs'>Price</FormLabel>}
                        <FormControl>
                          <Input {...field} placeholder='5.00' className='text-xs h-8' />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`availableDeliveryDates.${index}.freeShippingMinPrice`}
                    render={({ field }) => (
                      <FormItem className='w-32'>
                        {index === 0 && <FormLabel className='text-xs'>Free @ Min</FormLabel>}
                        <FormControl>
                          <Input {...field} placeholder='100' className='text-xs h-8' />
                        </FormControl>
                        <FormMessage className='text-xs' />
                      </FormItem>
                    )}
                  />
                  <div className='flex items-end'>
                    <Button
                      type='button'
                      disabled={deliveryFields.length === 1}
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0'
                      onClick={() => removeDelivery(index)}
                    >
                      <TrashIcon className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-xs h-8'
                onClick={() =>
                  appendDelivery({
                    name: '',
                    daysToDeliver: 0,
                    shippingPrice: 0,
                    freeShippingMinPrice: 0,
                  })
                }
              >
                Add Delivery Option
              </Button>
            </div>

            {/* Default Delivery Date */}
            <FormField
              control={control}
              name='defaultDeliveryDate'
              render={({ field }) => (
                <FormItem className='max-w-md'>
                  <FormLabel className='text-xs'>Default Delivery</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger className='h-8 text-xs'>
                        <SelectValue placeholder='Select default' />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDeliveryDates
                          .filter((x) => x.name)
                          .map((dd, index) => (
                            <SelectItem key={index} value={dd.name}>
                              {dd.name} - {dd.daysToDeliver} days
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

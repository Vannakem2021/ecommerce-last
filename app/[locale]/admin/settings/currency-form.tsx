import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ISettingInput } from '@/types'
import React from 'react'
import { UseFormReturn } from 'react-hook-form'

export default function CurrencyForm({
  form,
  id,
}: {
  form: UseFormReturn<ISettingInput>
  id: string
}) {
  const { control } = form

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle>Currencies</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* USD Currency - Fixed */}
        <div className='space-y-2'>
          <h3 className='text-sm font-medium'>USD (Base Currency)</h3>
          <div className='grid grid-cols-4 gap-2'>
            <FormField
              control={form.control}
              name={`availableCurrencies.0.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} value="United States Dollar" disabled />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`availableCurrencies.0.code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} value="USD" disabled />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`availableCurrencies.0.symbol`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input {...field} value="$" disabled />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`availableCurrencies.0.convertRate`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate</FormLabel>
                  <FormControl>
                    <Input {...field} value="1" disabled />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* KHR Currency - Editable */}
        <div className='space-y-2'>
          <h3 className='text-sm font-medium'>KHR (Khmer Riel)</h3>
          <div className='grid grid-cols-4 gap-2'>
            <FormField
              control={form.control}
              name={`availableCurrencies.1.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} placeholder="Khmer Riel" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`availableCurrencies.1.code`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} placeholder="KHR" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`availableCurrencies.1.symbol`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Symbol</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} placeholder="៛" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`availableCurrencies.1.convertRate`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate (1 USD = ? KHR)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="4100"
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
              <FormLabel>Default Currency</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">
                      United States Dollar (USD)
                    </SelectItem>
                    <SelectItem value="KHR">
                      Khmer Riel (KHR)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• USD is the base currency (rate = 1)</p>
          <p>• Update KHR exchange rate as needed (e.g., 1 USD = 4100 KHR)</p>
          <p>• Users can switch between currencies on the frontend</p>
        </div>
      </CardContent>
    </Card>
  )
}

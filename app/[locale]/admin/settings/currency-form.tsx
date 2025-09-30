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
      <CardContent className='space-y-4'>
        <div className='space-y-4'>
          <div className='flex gap-2'>
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
                  <FormLabel>Convert Rate</FormLabel>
                  <FormControl>
                    <Input {...field} value="1" disabled />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={control}
          name='defaultCurrency'
          render={() => (
            <FormItem>
              <FormLabel>Default Currency</FormLabel>
              <FormControl>
                <Select
                  value="USD"
                  disabled
                >
                  <SelectTrigger>
                    <SelectValue placeholder="USD" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">
                      United States Dollar (USD)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="text-sm text-muted-foreground">
          Currency is fixed to USD and managed by code. Contact system administrator for changes.
        </div>
      </CardContent>
    </Card>
  )
}

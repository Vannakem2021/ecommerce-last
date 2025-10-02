'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Check } from 'lucide-react'
import useSettingStore from '@/hooks/use-setting-store'
import { cn } from '@/lib/utils'

export default function CurrencySwitcher() {
  const { setting, setCurrency, getCurrency } = useSettingStore()
  const currentCurrency = getCurrency()

  const handleCurrencyChange = (currencyCode: string) => {
    setCurrency(currencyCode)
    // Refresh the page to update all prices
    window.location.reload()
  }

  const currencies = setting.availableCurrencies || []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center gap-1 hover:text-primary transition-colors text-sm'>
        <span>{currentCurrency.code}</span>
        <ChevronDown className='h-3 w-3' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {currencies.map((currency, index) => (
          <DropdownMenuItem
            key={`${currency.code}-${index}`}
            className='cursor-pointer flex items-center justify-between'
            onClick={() => handleCurrencyChange(currency.code)}
          >
            <span>{currency.code} ({currency.symbol}) - {currency.name}</span>
            {currentCurrency.code === currency.code && (
              <Check className='h-4 w-4 ml-2' />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

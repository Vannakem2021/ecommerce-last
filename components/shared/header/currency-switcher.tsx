'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

export default function CurrencySwitcher() {
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
  ]

  const currentCurrency = currencies[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center gap-1 hover:text-primary transition-colors text-sm'>
        <span>{currentCurrency.code}</span>
        <ChevronDown className='h-3 w-3' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {currencies.map((currency) => (
          <DropdownMenuItem key={currency.code} className='cursor-pointer'>
            {currency.code} ({currency.symbol}) - {currency.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

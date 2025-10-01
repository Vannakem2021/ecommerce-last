'use client'
import React from 'react'
import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { i18n } from '@/i18n-config'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const locale = useLocale()

  const currentLocale = i18n.locales.find((l) => l.code === locale)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='flex items-center gap-1 hover:text-primary transition-colors text-sm'>
        <span>{currentLocale?.flag}</span>
        <span>{currentLocale?.name}</span>
        <ChevronDown className='h-3 w-3' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {i18n.locales.map((l) => (
          <Link key={l.code} href={pathname} locale={l.code}>
            <DropdownMenuItem className='cursor-pointer flex items-center gap-2'>
              <span>{l.flag}</span>
              <span>{l.name}</span>
            </DropdownMenuItem>
          </Link>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

'use client'
import React from 'react'
import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { i18n } from '@/i18n-config'

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const locale = useLocale()

  return (
    <div className='flex items-center gap-2'>
      <span className='text-sm font-semibold'>Language:</span>
      <div className='flex items-center gap-1.5'>
        {i18n.locales.map((l, idx) => (
          <React.Fragment key={l.code}>
            <Link
              href={pathname}
              locale={l.code}
              className={`px-0.5 hover:opacity-80 text-lg leading-none focus:outline-none ${l.code === locale ? 'opacity-100' : 'opacity-70'}`}
              aria-label={`Switch language to ${l.name}`}
            >
              {l.flag}
            </Link>
            {idx < i18n.locales.length - 1 && <span className='opacity-50 text-xs'>|</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

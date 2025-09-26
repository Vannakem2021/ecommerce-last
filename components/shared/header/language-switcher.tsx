'use client'
import React from 'react'
import { useLocale } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { i18n } from '@/i18n-config'

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const locale = useLocale()
  const searchParams = useSearchParams()

  return (
    <div className='flex items-center gap-2'>
      <span className='text-sm font-semibold'>Language:</span>
      <div className='flex items-center gap-2'>
        {i18n.locales.map((l, idx) => (
          <React.Fragment key={l.code}>
            <Link
              href={`${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
              locale={l.code}
              className={`px-1 hover:opacity-80 ${l.code === locale ? 'ring-1 ring-white/60 rounded' : ''}`}
              aria-label={`Switch language to ${l.name}`}
            >
              <img
                src={l.flag.src}
                srcSet={l.flag.srcset}
                width={l.flag.width}
                height={l.flag.height}
                alt={l.flag.alt}
                className="object-cover"
              />
            </Link>
            {idx < i18n.locales.length - 1 && <span className='opacity-70'>|</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

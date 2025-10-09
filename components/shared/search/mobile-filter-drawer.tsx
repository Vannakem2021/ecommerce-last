'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { SlidersHorizontal } from 'lucide-react'
import { ReactNode, useState } from 'react'

interface MobileFilterDrawerProps {
  children: ReactNode
  title: string
  activeFiltersCount?: number
}

export default function MobileFilterDrawer({
  children,
  title,
  activeFiltersCount = 0,
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='outline' className='w-full md:hidden gap-2'>
          <SlidersHorizontal className='h-4 w-4' />
          {title}
          {activeFiltersCount > 0 && (
            <span className='ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold'>
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side='left' className='w-[300px] sm:w-[400px] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className='mt-6'>{children}</div>
      </SheetContent>
    </Sheet>
  )
}

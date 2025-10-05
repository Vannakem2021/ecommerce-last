'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ProductTab {
  value: string
  label: string
  content: ReactNode
}

interface ProductTabsProps {
  tabs: ProductTab[]
  defaultTab?: string
  className?: string
}

export default function ProductTabs({
  tabs,
  defaultTab,
  className,
}: ProductTabsProps) {
  return (
    <Tabs defaultValue={defaultTab || tabs[0]?.value} className={cn('w-full', className)}>
      <TabsList className='w-full justify-start h-auto p-1 bg-muted/30'>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className='data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2'
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className='mt-6 focus-visible:outline-none focus-visible:ring-0'
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

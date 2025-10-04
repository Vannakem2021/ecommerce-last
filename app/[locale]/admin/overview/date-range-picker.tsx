'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn, formatDateTime, calculatePastDate } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { PopoverClose } from '@radix-ui/react-popover'

type PresetKey = '7d' | '30d' | 'thisMonth' | 'lastMonth' | 'custom'

interface DatePreset {
  key: PresetKey
  label: string
  getDates: () => DateRange
}

const DATE_PRESETS: DatePreset[] = [
  {
    key: '7d',
    label: 'Last 7 Days',
    getDates: () => ({
      from: calculatePastDate(7),
      to: new Date(),
    }),
  },
  {
    key: '30d',
    label: 'Last 30 Days',
    getDates: () => ({
      from: calculatePastDate(30),
      to: new Date(),
    }),
  },
  {
    key: 'thisMonth',
    label: 'This Month',
    getDates: () => {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        from: firstDay,
        to: now,
      }
    },
  },
  {
    key: 'lastMonth',
    label: 'Last Month',
    getDates: () => {
      const now = new Date()
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        from: firstDayLastMonth,
        to: lastDayLastMonth,
      }
    },
  },
]

export function CalendarDateRangePicker({
  defaultDate,
  setDate,
  className,
}: {
  defaultDate?: DateRange
  setDate: React.Dispatch<React.SetStateAction<DateRange | undefined>>
  className?: string
}) {
  const [activePreset, setActivePreset] = React.useState<PresetKey>('30d')
  const [calendarDate, setCalendarDate] = React.useState<DateRange | undefined>(
    defaultDate
  )

  // Initialize with default preset on mount
  React.useEffect(() => {
    if (defaultDate?.from && defaultDate?.to) {
      setCalendarDate(defaultDate)
    }
  }, [defaultDate])

  const handlePresetClick = (preset: DatePreset) => {
    const dates = preset.getDates()
    setActivePreset(preset.key)
    setDate(dates)
    setCalendarDate(dates)
  }

  const handleCustomApply = () => {
    setActivePreset('custom')
    setDate(calendarDate)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Quick Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {DATE_PRESETS.map((preset) => (
          <Button
            key={preset.key}
            variant={activePreset === preset.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePresetClick(preset)}
            className={cn(
              'transition-all',
              activePreset === preset.key && 'shadow-sm'
            )}
          >
            {preset.label}
          </Button>
        ))}

        {/* Custom Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={activePreset === 'custom' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'transition-all',
                activePreset === 'custom' && 'shadow-sm'
              )}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              Custom
            </Button>
          </PopoverTrigger>
          <PopoverContent
            onCloseAutoFocus={() => setCalendarDate(defaultDate)}
            className='w-auto p-0'
            align='end'
          >
            <Calendar
              mode='range'
              defaultMonth={defaultDate?.from}
              selected={calendarDate}
              onSelect={setCalendarDate}
              numberOfMonths={2}
            />
            <div className='flex gap-2 p-4 pt-0'>
              <PopoverClose asChild>
                <Button onClick={handleCustomApply} size="sm">
                  Apply
                </Button>
              </PopoverClose>
              <PopoverClose asChild>
                <Button variant={'outline'} size="sm">
                  Cancel
                </Button>
              </PopoverClose>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Date Range Display */}
      {calendarDate?.from && calendarDate?.to && (
        <p className="text-xs text-muted-foreground">
          Showing data from {formatDateTime(calendarDate.from).dateOnly} to{' '}
          {formatDateTime(calendarDate.to).dateOnly}
        </p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ISettingInput } from '@/types'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GripVertical, Plus, Trash2, Eye, EyeOff } from 'lucide-react'

interface HomePageFormProps {
  form: UseFormReturn<ISettingInput>
}

const DEFAULT_SECTIONS = [
  {
    id: 'hot-deals',
    type: 'dynamic' as const,
    title: { en: 'Discover Hot Deals', kh: 'ស្វែងរកការផ្តល់ជូនពិសេស' },
    enabled: true,
    limit: 6,
    order: 1,
  },
  {
    id: 'new-arrivals',
    type: 'dynamic' as const,
    title: { en: 'New Arrivals', kh: 'ទំនិញទើបមកដល់' },
    enabled: true,
    limit: 6,
    order: 2,
  },
  {
    id: 'best-sellers',
    type: 'dynamic' as const,
    title: { en: 'Best Sellers', kh: 'ផលិតផលលក់ដាច់បំផុត' },
    enabled: true,
    limit: 6,
    order: 3,
  },
  {
    id: 'smartphones',
    type: 'category' as const,
    title: { en: 'Smartphones', kh: 'ទូរស័ព្ទ' },
    enabled: true,
    limit: 6,
    order: 4,
    categoryName: 'Smartphones',
  },
  {
    id: 'laptops',
    type: 'category' as const,
    title: { en: 'Laptops', kh: 'កុំព្យូទ័រយួរដៃ' },
    enabled: true,
    limit: 6,
    order: 5,
    categoryName: 'Laptops',
  },
  {
    id: 'tablets',
    type: 'category' as const,
    title: { en: 'Tablets', kh: 'ថេប្លេត' },
    enabled: true,
    limit: 6,
    order: 6,
    categoryName: 'Tablets',
  },
  {
    id: 'second-hand',
    type: 'dynamic' as const,
    title: { en: 'Second Hand', kh: 'ប្រើប្រាស់មកហើយ' },
    enabled: true,
    limit: 6,
    order: 7,
  },
]

export default function HomePageForm({ form }: HomePageFormProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Initialize with default sections if empty
  const sections = form.watch('homePage.sections') || []
  
  if (sections.length === 0) {
    form.setValue('homePage.sections', DEFAULT_SECTIONS)
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newSections = [...sections]
    const draggedSection = newSections[draggedIndex]
    newSections.splice(draggedIndex, 1)
    newSections.splice(index, 0, draggedSection)

    // Update order values
    newSections.forEach((section, idx) => {
      section.order = idx + 1
    })

    form.setValue('homePage.sections', newSections)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const toggleSection = (index: number) => {
    const currentSections = form.getValues('homePage.sections')
    const newSections = [...currentSections]
    newSections[index].enabled = !newSections[index].enabled
    form.setValue('homePage.sections', newSections)
  }

  const removeSection = (index: number) => {
    const currentSections = form.getValues('homePage.sections')
    const newSections = currentSections.filter((_, i) => i !== index)
    // Update order values
    newSections.forEach((section, idx) => {
      section.order = idx + 1
    })
    form.setValue('homePage.sections', newSections)
  }

  const resetToDefaults = () => {
    form.setValue('homePage.sections', DEFAULT_SECTIONS)
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div>
          <CardTitle>Home Page Sections</CardTitle>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage which sections appear on the home page and in what order
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={resetToDefaults}
        >
          Reset to Defaults
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {sections.length === 0 ? (
          <div className='text-center py-8 text-muted-foreground'>
            No sections configured. Click "Reset to Defaults" to add default sections.
          </div>
        ) : (
          <div className='space-y-3'>
            {sections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border bg-card
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  ${!section.enabled ? 'opacity-60' : ''}
                  hover:border-primary/50 transition-colors cursor-move
                `}
              >
                {/* Drag Handle */}
                <div className='cursor-grab active:cursor-grabbing'>
                  <GripVertical className='h-5 w-5 text-muted-foreground' />
                </div>

                {/* Section Info */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <h4 className='font-medium text-sm'>
                      {section.title.en}
                    </h4>
                    <span className='text-xs px-2 py-0.5 rounded-full bg-secondary'>
                      {section.type}
                    </span>
                    {section.categoryName && (
                      <span className='text-xs text-muted-foreground'>
                        ({section.categoryName})
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Order: {section.order} • Limit: {section.limit} products
                  </p>
                </div>

                {/* Limit Control */}
                <div className='flex items-center gap-2'>
                  <label className='text-xs text-muted-foreground'>Limit:</label>
                  <Input
                    type='number'
                    min={1}
                    max={12}
                    value={section.limit}
                    onChange={(e) => {
                      const newSections = [...sections]
                      newSections[index].limit = parseInt(e.target.value) || 6
                      form.setValue('homePage.sections', newSections)
                    }}
                    className='w-16 h-8 text-sm'
                  />
                </div>

                {/* Actions */}
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => toggleSection(index)}
                    className='h-8 w-8 p-0'
                  >
                    {section.enabled ? (
                      <Eye className='h-4 w-4' />
                    ) : (
                      <EyeOff className='h-4 w-4' />
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => removeSection(index)}
                    className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className='pt-4 border-t'>
          <h4 className='font-medium text-sm mb-2'>Instructions:</h4>
          <ul className='text-sm text-muted-foreground space-y-1'>
            <li>• <strong>Drag</strong> the handle (☰) to reorder sections</li>
            <li>• <strong>Eye icon</strong> to show/hide sections on home page</li>
            <li>• <strong>Limit</strong> controls how many products appear in each section</li>
            <li>• <strong>Delete</strong> icon to remove a section completely</li>
            <li>• Changes save automatically when you modify settings</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

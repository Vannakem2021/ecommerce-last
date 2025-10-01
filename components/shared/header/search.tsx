import { SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { getAllCategories } from '@/lib/actions/product.actions'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { getSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'

export default async function Search() {
  const {
    site: { name },
  } = await getSetting()
  const categories = await getAllCategories()

  const t = await getTranslations()
  return (
    <form action='/search' method='GET' className='flex items-stretch h-12 shadow-sm'>
      <Select name='category'>
        <SelectTrigger className='w-40 h-full bg-background border border-r-0 rounded-none hover:bg-muted/50 transition-colors'>
          <SelectValue placeholder={t('Header.All') + ' Categories'} />
        </SelectTrigger>
        <SelectContent position='popper'>
          <SelectItem value='all'>{t('Header.All')} Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className='flex-1 rounded-none bg-background border-y h-full focus-visible:ring-0 focus-visible:ring-offset-0'
        placeholder='Search For Products'
        name='q'
        type='search'
      />
      <button
        type='submit'
        className='bg-primary hover:bg-primary/90 text-white rounded-none h-full px-6 py-2 transition-colors flex items-center justify-center'
      >
        <SearchIcon className='w-5 h-5' />
      </button>
    </form>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategoryById } from '@/lib/actions/category.actions'
import CategoryForm from '../category-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Update Category',
}

export default async function UpdateCategoryPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params
  const category = await getCategoryById(params.id)
  if (!category) notFound()

  return (
    <div className='space-y-2'>
      <div className='flex mb-4'>
        <Link href='/admin/categories'>Categories</Link>
        <span className='mx-1'>/</span>
        <span>Update</span>
      </div>

      <div className='my-8'>
        <CategoryForm type='Update' category={category} categoryId={category._id} />
      </div>
    </div>
  )
}

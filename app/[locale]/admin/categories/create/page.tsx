import Link from 'next/link'
import CategoryForm from '../category-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Category',
}

const CreateCategoryPage = () => {
  return (
    <div className='space-y-2'>
      <div className='flex mb-4'>
        <Link href='/admin/categories'>Categories</Link>
        <span className='mx-1'>/</span>
        <span>Create</span>
      </div>

      <div className='my-8'>
        <CategoryForm type='Create' />
      </div>
    </div>
  )
}

export default CreateCategoryPage

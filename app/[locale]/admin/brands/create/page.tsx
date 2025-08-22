import Link from 'next/link'
import BrandForm from '../brand-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Brand',
}

const CreateBrandPage = () => {
  return (
    <div className='space-y-2'>
      <div className='flex mb-4'>
        <Link href='/admin/brands'>Brands</Link>
        <span className='mx-1'>/</span>
        <span>Create</span>
      </div>

      <div className='my-8'>
        <BrandForm type='Create' />
      </div>
    </div>
  )
}

export default CreateBrandPage

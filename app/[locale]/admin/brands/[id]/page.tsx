import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBrandById } from '@/lib/actions/brand.actions'
import BrandForm from '../brand-form'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Update Brand',
}

export default async function UpdateBrandPage(props: {
  params: Promise<{
    id: string
  }>
}) {
  const params = await props.params
  const brand = await getBrandById(params.id)
  if (!brand) notFound()

  return (
    <div className='space-y-2'>
      <div className='flex mb-4'>
        <Link href='/admin/brands'>Brands</Link>
        <span className='mx-1'>/</span>
        <span>Update</span>
      </div>

      <div className='my-8'>
        <BrandForm type='Update' brand={brand} brandId={brand._id} />
      </div>
    </div>
  )
}

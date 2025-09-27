import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBrandById } from '@/lib/actions/brand.actions'
import BrandForm from '../brand-form'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ChevronLeft, TagIcon } from 'lucide-react'

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
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
            <Link href="/admin/brands" className="flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Brands
            </Link>
          </Button>
          <span>/</span>
          <span className="text-foreground">Edit Brand</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                <TagIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Edit Brand</h1>
                <p className="text-muted-foreground mt-1">
                  Update brand information and settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <BrandForm type='Update' brand={brand} brandId={brand._id} />
    </div>
  )
}

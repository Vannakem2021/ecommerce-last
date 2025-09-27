import Link from 'next/link'
import BrandForm from '../brand-form'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Plus, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Create Brand',
}

const CreateBrandPage = () => {
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
          <span className="text-foreground">Create Brand</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950">
                <div className="relative">
                  <Tag className="h-6 w-6 text-emerald-600" />
                  <Plus className="h-3 w-3 text-emerald-600 absolute -top-1 -right-1" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Create Brand</h1>
                <p className="text-muted-foreground mt-1">
                  Add a new brand to organize your products
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <BrandForm type='Create' />
    </div>
  )
}

export default CreateBrandPage

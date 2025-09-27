import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCategoryById } from '@/lib/actions/category.actions'
import CategoryForm from '../category-form'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ChevronLeft, FolderEdit } from 'lucide-react'

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
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
            <Link href="/admin/categories" className="flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Categories
            </Link>
          </Button>
          <span>/</span>
          <span className="text-foreground">Edit Category</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950">
                <FolderEdit className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Edit Category</h1>
                <p className="text-muted-foreground mt-1">
                  Update category information and settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <CategoryForm type='Update' category={category} categoryId={category._id} />
    </div>
  )
}

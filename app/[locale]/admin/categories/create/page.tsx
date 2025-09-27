import Link from 'next/link'
import CategoryForm from '../category-form'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ChevronLeft, FolderPlus } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Create Category',
}

const CreateCategoryPage = () => {
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
          <span className="text-foreground">Create Category</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <FolderPlus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Create Category</h1>
                <p className="text-muted-foreground mt-1">
                  Add a new category to organize your products
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <CategoryForm type='Create' />
    </div>
  )
}

export default CreateCategoryPage

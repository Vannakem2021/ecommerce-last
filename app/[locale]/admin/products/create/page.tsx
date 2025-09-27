import Link from 'next/link'
import ProductForm from '../product-form'
import { Metadata } from 'next'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Create Product',
}

const CreateProductPage = () => {
  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="flex items-center gap-2">
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Product</h1>
            <p className="text-muted-foreground mt-1">
              Add a new product to your catalog
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-muted-foreground">
        <Link href="/admin/products" className="hover:text-foreground transition-colors">
          Products
        </Link>
        <span className="mx-2">›</span>
        <span className="text-foreground">Create Product</span>
      </div>

      {/* Form */}
      <ProductForm type='Create' />
    </div>
  )
}

export default CreateProductPage

import { Metadata } from 'next'
import Link from 'next/link'
import WebPageForm from '../web-page-form'
import { Button } from '@/components/ui/button'
import { ChevronLeft, FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Create Web Page',
}

export default function CreateWebPagePage() {
  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="space-y-4">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button asChild variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
            <Link href="/admin/web-pages" className="flex items-center gap-1 hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
              Web Pages
            </Link>
          </Button>
          <span>/</span>
          <span className="text-foreground">Create Page</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Create Web Page</h1>
                <p className="text-muted-foreground mt-1">
                  Add a new page to your website
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <WebPageForm type='Create' />
    </div>
  )
}

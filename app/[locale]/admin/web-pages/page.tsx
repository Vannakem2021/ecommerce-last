import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllWebPages } from '@/lib/actions/web-page.actions'
import {
  Plus,
  FileText,
  Globe,
  EyeOff
} from 'lucide-react'
import WebPagesClient from './web-pages-client'

export const metadata: Metadata = {
  title: 'Admin Web Pages',
}

export default async function WebPageAdminPage() {
  const webPages = await getAllWebPages()

  // Calculate page statistics
  const publishedPages = webPages.filter(page => page.isPublished).length
  const draftPages = webPages.filter(page => !page.isPublished).length
  const totalPages = webPages.length

  return (
    <div className="space-y-6">
      {/* Professional Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Web Pages</h1>
          <p className="text-muted-foreground mt-1">
            Manage website content and static pages
          </p>
        </div>
        <Button asChild className="flex items-center gap-2">
          <Link href="/admin/web-pages/create">
            <Plus className="h-4 w-4" />
            Create Page
          </Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPages}</div>
            <p className="text-xs text-muted-foreground">
              All web pages
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Globe className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{publishedPages}</div>
            <p className="text-xs text-muted-foreground">
              {totalPages > 0 ? Math.round((publishedPages / totalPages) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <EyeOff className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{draftPages}</div>
            <p className="text-xs text-muted-foreground">
              {totalPages > 0 ? Math.round((draftPages / totalPages) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <WebPagesClient initialWebPages={webPages} />
    </div>
  )
}

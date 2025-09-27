import { Metadata } from 'next'
import Link from 'next/link'

import DeleteDialog from '@/components/shared/delete-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteWebPage, getAllWebPages } from '@/lib/actions/web-page.actions'
import { IWebPage } from '@/lib/db/models/web-page.model'
import { formatDateTime } from '@/lib/utils'
import {
  Plus,
  FileText,
  Globe,
  Eye,
  EyeOff,
  Edit,
  Calendar,
  Download,
  Upload,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'

export const metadata: Metadata = {
  title: 'Admin Web Pages',
}

export default async function WebPageAdminPage() {
  const webPages = await getAllWebPages()

  // Calculate page statistics
  const publishedPages = webPages.filter(page => page.isPublished).length
  const draftPages = webPages.filter(page => !page.isPublished).length
  const totalPages = webPages.length

  // Get recent pages (created in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentPages = webPages.filter(page => new Date(page.createdAt) > thirtyDaysAgo).length

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
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button asChild className="flex items-center gap-2">
            <Link href="/admin/web-pages/create">
              <Plus className="h-4 w-4" />
              Create Page
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPages}</div>
            <p className="text-xs text-muted-foreground">
              +{recentPages} this month
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{recentPages}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pages Overview</CardTitle>
              <CardDescription>
                Showing {totalPages} page{totalPages !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pages..."
                  className="pl-8 w-[250px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/50 border-b">
                  <TableHead className="font-semibold text-foreground">PAGE</TableHead>
                  <TableHead className="font-semibold text-foreground">SLUG</TableHead>
                  <TableHead className="font-semibold text-foreground">STATUS</TableHead>
                  <TableHead className="font-semibold text-foreground">CREATED</TableHead>
                  <TableHead className="w-[100px] font-semibold text-foreground">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webPages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                        <p>No pages found</p>
                        <p className="text-sm">Create your first page to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  webPages.map((webPage: IWebPage) => (
                    <TableRow key={webPage._id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{webPage.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {webPage.content.length > 50
                                ? `${webPage.content.substring(0, 50)}...`
                                : webPage.content}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          /{webPage.slug}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={webPage.isPublished ? 'default' : 'secondary'}
                          className={webPage.isPublished
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          }
                        >
                          {webPage.isPublished ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Draft
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <div className="text-sm">
                            {formatDateTime(webPage.createdAt).dateOnly}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1">
                          <Button asChild variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                            <Link href={`/admin/web-pages/${webPage._id}`}>
                              <Edit className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <DeleteDialog id={webPage._id} action={deleteWebPage} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

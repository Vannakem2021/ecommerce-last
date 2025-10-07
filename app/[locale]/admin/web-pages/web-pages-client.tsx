'use client'

import { useState } from 'react'
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
import { IWebPage } from '@/lib/db/models/web-page.model'
import { formatDateTime } from '@/lib/utils'
import {
  FileText,
  Globe,
  Eye,
  EyeOff,
  Edit,
  Calendar,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import DeleteDialog from '@/components/shared/delete-dialog'
import { deleteWebPage } from '@/lib/actions/web-page.actions'

interface WebPagesClientProps {
  initialWebPages: IWebPage[]
}

export default function WebPagesClient({ initialWebPages }: WebPagesClientProps) {
  const [searchValue, setSearchValue] = useState('')

  // Client-side filtering
  const filteredWebPages = initialWebPages.filter(page => {
    if (!searchValue) return true
    
    const searchLower = searchValue.toLowerCase()
    return (
      page.title.toLowerCase().includes(searchLower) ||
      page.content.toLowerCase().includes(searchLower) ||
      page.slug.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = filteredWebPages.length

  return (
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
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
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
              {filteredWebPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground/50" />
                      <p>{searchValue ? 'No pages found matching your search' : 'No pages found'}</p>
                      {!searchValue && <p className="text-sm">Create your first page to get started</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredWebPages.map((webPage: IWebPage) => (
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
  )
}

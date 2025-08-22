'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { deleteCategory } from '@/lib/actions/category.actions'
import { ICategory } from '@/lib/db/models/category.model'
import { formatDateTime } from '@/lib/utils'
import { Edit, Trash } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import { useToast } from '@/hooks/use-toast'
import DeleteDialog from '@/components/shared/delete-dialog'

export default function CategoryList({
  data,
  totalCategories,
  page,
  totalPages,
}: {
  data: ICategory[]
  totalCategories: number
  page: number
  totalPages: number
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const res = await deleteCategory(id)
      if (res.success) {
        toast({
          description: res.message,
        })
      } else {
        toast({
          variant: 'destructive',
          description: res.message,
        })
      }
    })
  }

  return (
    <div className='space-y-2'>
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell className='font-medium'>{category.name}</TableCell>
                    <TableCell>
                      <Badge variant={category.active ? 'default' : 'secondary'}>
                        {category.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(category.createdAt).dateTime}</TableCell>
                    <TableCell className='flex gap-1'>
                      <Button asChild variant='outline' size='sm'>
                        <Link href={`/admin/categories/${category._id}`}>
                          <Edit className='w-4 h-4' />
                        </Link>
                      </Button>
                      <DeleteDialog id={category._id} action={handleDelete} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='flex items-center justify-between mt-4'>
            <div className='text-sm text-muted-foreground'>
              Showing {data.length} of {totalCategories} categories
            </div>
            <div className='text-sm text-muted-foreground'>
              Page {page} of {totalPages}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

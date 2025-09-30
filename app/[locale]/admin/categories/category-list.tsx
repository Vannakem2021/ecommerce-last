'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Edit, FolderIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'
import { useTransition } from 'react'
import { useToast } from '@/hooks/use-toast'
import DeleteDialog from '@/components/shared/delete-dialog'

export default function CategoryList({
  data,
}: {
  data: ICategory[]
  totalCategories: number
  page: number
  totalPages: number
}) {
  const { toast } = useToast()
  const [, startTransition] = useTransition()

  const handleDelete = async (id: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
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
        resolve(res)
      })
    })
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/30 hover:bg-muted/50 border-b'>
            <TableHead className='font-semibold text-foreground'>NAME</TableHead>
            <TableHead className='font-semibold text-foreground'>STATUS</TableHead>
            <TableHead className='font-semibold text-foreground'>CREATED AT</TableHead>
            <TableHead className='w-[100px] font-semibold text-foreground'>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className='text-center py-8 text-muted-foreground'>
                <div className='flex flex-col items-center gap-2'>
                  <FolderIcon className='h-8 w-8 text-muted-foreground/50' />
                  <p>No categories found</p>
                  <p className='text-sm'>Create your first category to get started</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((category) => (
              <TableRow key={category._id} className='hover:bg-muted/30 transition-colors border-b border-border/50'>
                <TableCell className='font-medium py-3'>
                  <div className='flex items-center gap-3'>
                    <div className='p-1.5 rounded-md bg-blue-50 dark:bg-blue-950'>
                      <FolderIcon className='h-3.5 w-3.5 text-blue-600' />
                    </div>
                    <div>
                      <div className='font-medium text-foreground'>{category.name}</div>
                      {category.description && (
                        <div className='text-sm text-muted-foreground line-clamp-1'>
                          {category.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className='py-3'>
                  <Badge
                    variant={category.active ? 'default' : 'secondary'}
                    className={category.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                  >
                    {category.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className='py-3 text-muted-foreground'>
                  {formatDateTime(category.createdAt).dateTime}
                </TableCell>
                <TableCell className='py-3'>
                  <div className='flex items-center gap-1'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant='ghost' size='sm' className='h-8 w-8 p-0 hover:bg-muted'>
                            <Link href={`/admin/categories/${category._id}`}>
                              <Edit className='h-3.5 w-3.5' />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit category</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DeleteDialog id={category._id} action={handleDelete} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

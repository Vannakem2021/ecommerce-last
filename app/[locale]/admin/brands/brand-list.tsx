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
import { deleteBrand } from '@/lib/actions/brand.actions'
import { IBrand } from '@/lib/db/models/brand.model'
import { formatDateTime } from '@/lib/utils'
import { Edit, TagIcon, ImageIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import Link from 'next/link'
import Image from 'next/image'
import { useTransition } from 'react'
import { useToast } from '@/hooks/use-toast'
import DeleteDialog from '@/components/shared/delete-dialog'

export default function BrandList({
  data,
  totalBrands,
  page,
  totalPages,
}: {
  data: IBrand[]
  totalBrands: number
  page: number
  totalPages: number
}) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const res = await deleteBrand(id)
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
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow className='bg-muted/30 hover:bg-muted/50 border-b'>
            <TableHead className='font-semibold text-foreground'>LOGO</TableHead>
            <TableHead className='font-semibold text-foreground'>NAME</TableHead>
            <TableHead className='font-semibold text-foreground'>STATUS</TableHead>
            <TableHead className='font-semibold text-foreground'>CREATED AT</TableHead>
            <TableHead className='w-[100px] font-semibold text-foreground'>ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className='text-center py-8 text-muted-foreground'>
                <div className='flex flex-col items-center gap-2'>
                  <TagIcon className='h-8 w-8 text-muted-foreground/50' />
                  <p>No brands found</p>
                  <p className='text-sm'>Create your first brand to get started</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((brand) => (
              <TableRow key={brand._id} className='hover:bg-muted/30 transition-colors border-b border-border/50'>
                <TableCell className='py-3'>
                  <div className='flex items-center'>
                    {brand.logo ? (
                      <div className='relative w-10 h-10 rounded-lg overflow-hidden border border-border/50'>
                        <Image
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          fill
                          className='object-contain p-1'
                        />
                      </div>
                    ) : (
                      <div className='w-10 h-10 bg-muted rounded-lg flex items-center justify-center border border-border/50'>
                        <ImageIcon className='h-4 w-4 text-muted-foreground' />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className='font-medium py-3'>
                  <div className='flex items-center gap-3'>
                    <div className='p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950'>
                      <TagIcon className='h-3.5 w-3.5 text-emerald-600' />
                    </div>
                    <div>
                      <div className='font-medium text-foreground'>{brand.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className='py-3'>
                  <Badge
                    variant={brand.active ? 'default' : 'secondary'}
                    className={brand.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                  >
                    {brand.active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className='py-3 text-muted-foreground'>
                  {formatDateTime(brand.createdAt).dateTime}
                </TableCell>
                <TableCell className='py-3'>
                  <div className='flex items-center gap-1'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant='ghost' size='sm' className='h-8 w-8 p-0 hover:bg-muted'>
                            <Link href={`/admin/brands/${brand._id}`}>
                              <Edit className='h-3.5 w-3.5' />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit brand</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DeleteDialog id={brand._id} action={handleDelete} />
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

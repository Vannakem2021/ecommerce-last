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
import { deleteBrand } from '@/lib/actions/brand.actions'
import { IBrand } from '@/lib/db/models/brand.model'
import { formatDateTime } from '@/lib/utils'
import { Edit, Trash } from 'lucide-react'
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
    <div className='space-y-2'>
      <Card>
        <CardHeader>
          <CardTitle>Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Logo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className='w-[100px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((brand) => (
                  <TableRow key={brand._id}>
                    <TableCell>
                      {brand.logo ? (
                        <Image
                          src={brand.logo}
                          alt={`${brand.name} logo`}
                          width={40}
                          height={40}
                          className='rounded object-contain'
                        />
                      ) : (
                        <div className='w-10 h-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground'>
                          No Logo
                        </div>
                      )}
                    </TableCell>
                    <TableCell className='font-medium'>{brand.name}</TableCell>
                    <TableCell>
                      <Badge variant={brand.active ? 'default' : 'secondary'}>
                        {brand.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDateTime(brand.createdAt).dateTime}</TableCell>
                    <TableCell className='flex gap-1'>
                      <Button asChild variant='outline' size='sm'>
                        <Link href={`/admin/brands/${brand._id}`}>
                          <Edit className='w-4 h-4' />
                        </Link>
                      </Button>
                      <DeleteDialog id={brand._id} action={handleDelete} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='flex items-center justify-between mt-4'>
            <div className='text-sm text-muted-foreground'>
              Showing {data.length} of {totalBrands} brands
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

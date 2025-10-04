'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteFAQ, toggleFAQActive } from '@/lib/actions/chatbot-faq.actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface FAQ {
  id: string
  category: string
  question: {
    en: string
    kh: string
  }
  answer: {
    en: string
    kh: string
  }
  order: number
  active: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface FAQListClientProps {
  initialFaqs: FAQ[]
  categories: string[]
}

export function FAQListClient({ initialFaqs, categories }: FAQListClientProps) {
  const router = useRouter()
  const [faqs, setFaqs] = useState(initialFaqs)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory)

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const result = await deleteFAQ(deleteId)
      
      if (result.success) {
        setFaqs(faqs.filter(faq => faq.id !== deleteId))
        toast.success('FAQ deleted successfully')
      } else {
        toast.error(result.error || 'Failed to delete FAQ')
      }
    } catch (error) {
      toast.error('Failed to delete FAQ')
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      const result = await toggleFAQActive(id)
      
      if (result.success) {
        setFaqs(faqs.map(faq => 
          faq.id === id ? { ...faq, active: result.active ?? !faq.active } : faq
        ))
        toast.success(result.message || 'Status updated')
      } else {
        toast.error(result.error || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="text-sm text-muted-foreground">
            {filteredFaqs.length} FAQ{filteredFaqs.length !== 1 ? 's' : ''}
          </div>
        </div>

        <Button asChild>
          <Link href="/admin/chatbot/new">
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Link>
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Order</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Question (EN)</TableHead>
              <TableHead>Question (KH)</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFaqs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No FAQs found. Create your first FAQ to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredFaqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="font-medium">{faq.order}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{faq.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {faq.question.en}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {faq.question.kh}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(faq.id)}
                      className="h-8 px-2"
                    >
                      {faq.active ? (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          <span className="text-gray-400">Inactive</span>
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/admin/chatbot/${faq.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(faq.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this FAQ. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

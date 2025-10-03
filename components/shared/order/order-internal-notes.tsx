'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { addInternalNote } from '@/lib/actions/order.actions'
import { PlusIcon, StickyNoteIcon, UserIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InternalNote {
  note: string
  createdBy: {
    _id?: string
    name: string
  }
  createdAt: Date | string
}

interface OrderInternalNotesProps {
  orderId: string
  notes?: InternalNote[]
  orderCreatedAt: Date | string
  paidAt?: Date | string | null
  deliveredAt?: Date | string | null
  isPaid: boolean
  isDelivered: boolean
}

export default function OrderInternalNotes({
  orderId,
  notes = [],
  orderCreatedAt,
  paidAt,
  deliveredAt,
  isPaid,
  isDelivered,
}: OrderInternalNotesProps) {
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // Combine system events and internal notes into a unified timeline
  type TimelineEvent = {
    type: 'system' | 'note'
    label: string
    timestamp: Date | string
    description: string
    createdBy?: string
  }

  const systemEvents: TimelineEvent[] = [
    {
      type: 'system',
      label: 'Order Created',
      timestamp: orderCreatedAt,
      description: 'Order placed by customer',
    },
  ]

  if (isPaid && paidAt) {
    systemEvents.push({
      type: 'system',
      label: 'Payment Received',
      timestamp: paidAt,
      description: 'Payment confirmed',
    })
  }

  if (isDelivered && deliveredAt) {
    systemEvents.push({
      type: 'system',
      label: 'Order Delivered',
      timestamp: deliveredAt,
      description: 'Delivered to customer',
    })
  }

  const noteEvents: TimelineEvent[] = notes.map((note) => ({
    type: 'note',
    label: 'Internal Note',
    timestamp: note.createdAt,
    description: note.note,
    createdBy: note.createdBy?.name || 'Admin',
  }))

  const allEvents = [...systemEvents, ...noteEvents].sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  const handleAddNote = () => {
    if (!noteText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a note',
      })
      return
    }

    startTransition(async () => {
      const result = await addInternalNote(orderId, noteText.trim())

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Note added successfully',
        })
        setNoteText('')
        setIsAddingNote(false)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        })
      }
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Order Notes & History</h2>
          <Badge variant="secondary">
            <StickyNoteIcon className="h-3 w-3 mr-1" />
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </Badge>
        </div>

        {/* Timeline */}
        <div className="space-y-3 mb-4">
          {allEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No events yet
            </p>
          ) : (
            allEvents.map((event, index) => (
              <div
                key={index}
                className={`flex gap-3 p-3 rounded-lg ${
                  event.type === 'note'
                    ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800'
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {event.type === 'note' ? (
                    <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900">
                      <StickyNoteIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900">
                      <UserIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{event.label}</p>
                      {event.createdBy && (
                        <p className="text-xs text-muted-foreground">
                          by {event.createdBy}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(event.timestamp as Date).dateTime}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Note Section */}
        <div className="pt-4 border-t">
          {!isAddingNote ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsAddingNote(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Internal Note
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note (only visible to admins)..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                disabled={isPending}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={isPending || !noteText.trim()}
                >
                  {isPending ? 'Adding...' : 'Add Note'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingNote(false)
                    setNoteText('')
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          <strong>Note:</strong> Internal notes are only visible to admins and
          not shown to customers.
        </p>
      </CardContent>
    </Card>
  )
}

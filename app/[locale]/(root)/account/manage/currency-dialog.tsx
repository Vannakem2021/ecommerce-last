'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { updateCurrencyPreference } from '@/lib/actions/user.actions'
import { DollarSign } from 'lucide-react'

interface CurrencyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentCurrency: 'USD' | 'KHR'
}

export function CurrencyDialog({ open, onOpenChange, currentCurrency }: CurrencyDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'KHR'>(currentCurrency)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSave() {
    if (selectedCurrency === currentCurrency) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)

    const result = await updateCurrencyPreference(selectedCurrency)
    
    if (!result.success) {
      toast({
        variant: 'destructive',
        description: result.message,
      })
      setIsSubmitting(false)
      return
    }

    toast({
      description: result.message,
    })

    setIsSubmitting(false)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Change Currency
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selectedCurrency} onValueChange={(value) => setSelectedCurrency(value as 'USD' | 'KHR')}>
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="USD" id="USD" />
              <Label htmlFor="USD" className="flex-1 cursor-pointer">
                <div className="font-medium">US Dollar ($)</div>
                <div className="text-sm text-muted-foreground">Display prices in USD</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer mt-3">
              <RadioGroupItem value="KHR" id="KHR" />
              <Label htmlFor="KHR" className="flex-1 cursor-pointer">
                <div className="font-medium">Khmer Riel (៛)</div>
                <div className="text-sm text-muted-foreground">បង្ហាញតម្លៃជារៀល</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

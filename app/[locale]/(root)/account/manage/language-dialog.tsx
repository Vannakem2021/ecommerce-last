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
import { updateLanguagePreference } from '@/lib/actions/user.actions'
import { Globe } from 'lucide-react'

interface LanguageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentLanguage: 'en-US' | 'kh'
}

export function LanguageDialog({ open, onOpenChange, currentLanguage }: LanguageDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedLanguage, setSelectedLanguage] = useState<'en-US' | 'kh'>(currentLanguage)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSave() {
    if (selectedLanguage === currentLanguage) {
      onOpenChange(false)
      return
    }

    setIsSubmitting(true)

    const result = await updateLanguagePreference(selectedLanguage)
    
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
            <Globe className="w-5 h-5" />
            Change Language
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as 'en-US' | 'kh')}>
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="en-US" id="en-US" />
              <Label htmlFor="en-US" className="flex-1 cursor-pointer">
                <div className="font-medium">English (US)</div>
                <div className="text-sm text-muted-foreground">Display interface in English</div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 cursor-pointer mt-3">
              <RadioGroupItem value="kh" id="kh" />
              <Label htmlFor="kh" className="flex-1 cursor-pointer">
                <div className="font-medium">ខ្មែរ (Khmer)</div>
                <div className="text-sm text-muted-foreground">បង្ហាញចំណុចប្រទាក់ជាភាសាខ្មែរ</div>
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

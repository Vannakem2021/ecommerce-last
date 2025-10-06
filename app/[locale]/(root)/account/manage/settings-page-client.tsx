'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, AlertTriangle } from 'lucide-react'
import { EditNameDialog } from './edit-name-dialog'
import { PasswordDialog } from './password-dialog'
import { ProfilePictureDialog } from './profile-picture-dialog'
import { PhoneDialog } from './phone-dialog'
import { LanguageDialog } from './language-dialog'
import { CurrencyDialog } from './currency-dialog'
import { DeleteAccountDialog } from './delete-account-dialog'

interface SettingsPageClientProps {
  user: {
    name: string
    email: string
    emailVerified: boolean
    image?: string
    phone?: string
    preferredLanguage: 'en-US' | 'kh'
    preferredCurrency: 'USD' | 'KHR'
  }
  hasPassword: boolean
}

export default function SettingsPageClient({ user, hasPassword }: SettingsPageClientProps) {
  const [profilePictureDialogOpen, setProfilePictureDialogOpen] = useState(false)
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false)
  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false)

  const languageDisplay = user.preferredLanguage === 'en-US' ? 'English (US)' : 'ខ្មែរ (Khmer)'
  const currencyDisplay = user.preferredCurrency === 'USD' ? 'US Dollar ($)' : 'Khmer Riel (៛)'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and security
        </p>
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        {/* Profile Picture */}
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-sm text-muted-foreground">
                {user.image ? 'Click to change' : 'Add a photo'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setProfilePictureDialogOpen(true)}
            >
              {user.image ? 'Change' : 'Upload'}
            </Button>
          </CardContent>
        </Card>

        {/* Name */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Name</p>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setNameDialogOpen(true)}
            >
              Edit
            </Button>
          </CardContent>
        </Card>

        {/* Phone */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Phone Number</p>
              <p className="text-sm text-muted-foreground">
                {user.phone || 'Not set'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setPhoneDialogOpen(true)}
            >
              {user.phone ? 'Edit' : 'Add'}
            </Button>
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Check className="w-3 h-3" />
              Verified
            </Badge>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Language</p>
              <p className="text-sm text-muted-foreground">{languageDisplay}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLanguageDialogOpen(true)}
            >
              Change
            </Button>
          </CardContent>
        </Card>

        {/* Currency */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Currency</p>
              <p className="text-sm text-muted-foreground">{currencyDisplay}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrencyDialogOpen(true)}
            >
              Change
            </Button>
          </CardContent>
        </Card>

        {/* Password */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                {hasPassword ? '••••••••' : 'Not set'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setPasswordDialogOpen(true)}
            >
              {hasPassword ? 'Change' : 'Set'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <div className="pt-6 border-t border-destructive/20">
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Irreversible actions that will permanently delete your data
            </p>
          </div>
          
          <Card className="border-destructive/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Delete Account</p>
                <p className="text-xs text-muted-foreground">
                  Permanently remove all your data
                </p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setDeleteAccountDialogOpen(true)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <ProfilePictureDialog
        open={profilePictureDialogOpen}
        onOpenChange={setProfilePictureDialogOpen}
        currentImage={user.image}
        userName={user.name}
      />

      <EditNameDialog 
        open={nameDialogOpen}
        onOpenChange={setNameDialogOpen}
        currentName={user.name}
      />

      <PhoneDialog
        open={phoneDialogOpen}
        onOpenChange={setPhoneDialogOpen}
        currentPhone={user.phone}
      />

      <LanguageDialog
        open={languageDialogOpen}
        onOpenChange={setLanguageDialogOpen}
        currentLanguage={user.preferredLanguage}
      />

      <CurrencyDialog
        open={currencyDialogOpen}
        onOpenChange={setCurrencyDialogOpen}
        currentCurrency={user.preferredCurrency}
      />
      
      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        hasPassword={hasPassword}
      />

      <DeleteAccountDialog
        open={deleteAccountDialogOpen}
        onOpenChange={setDeleteAccountDialogOpen}
        userEmail={user.email}
      />
    </div>
  )
}

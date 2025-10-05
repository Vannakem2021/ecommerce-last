# Profile Picture Upload Feature - Implementation Plan

## 📋 Current State Analysis

### ✅ What We Already Have:
1. **UploadThing Setup**:
   - UploadThing is already configured at `/app/api/uploadthing/core.ts`
   - `imageUploader` endpoint exists with 4MB max file size
   - Authentication middleware is implemented
   - Helper components: `UploadButton` and `UploadDropzone` exported from `/lib/uploadthing.ts`

2. **User Model**:
   - User schema already has `image: { type: String }` field (line 19 in `user.model.ts`)
   - Field is optional and ready to store image URLs

3. **Existing Upload Patterns**:
   - Brand logo upload implementation in `/app/[locale]/admin/brands/brand-form.tsx`
   - Carousel image upload in `/app/[locale]/admin/settings/carousel-form.tsx`
   - Consistent pattern: UploadButton → onClientUploadComplete → setValue('image', url)

4. **Account Page Structure**:
   - Layout with sidebar navigation at `/app/[locale]/(root)/account/layout.tsx`
   - Overview page at `/app/[locale]/(root)/account/page.tsx`
   - Settings page at `/app/[locale]/(root)/account/manage/page.tsx`
   - Avatar display using initials in layout sidebar

5. **User Actions**:
   - `updateUserName` action exists in `/lib/actions/user.actions.ts`
   - No `updateUserImage` action yet (needs to be created)

### ❌ What's Missing:
1. Server action to update user profile picture
2. Zod validation schema for profile image update
3. UI component for profile picture upload
4. Image preview and remove functionality
5. Profile picture display in account pages
6. Optimistic UI updates
7. Error handling for upload failures

---

## 🎯 Implementation Plan

### **Phase 1: Backend - Server Action & Validation** 🔧

#### 1.1 Create Validation Schema
**File**: `/lib/validator.ts`

**Task**: Add schema for profile image update

```typescript
export const UserImageUpdateSchema = z.object({
  image: z.string().url("Must be a valid image URL").min(1, "Image is required"),
});
```

**Why**: Validates that the image URL is properly formatted before updating the database.

---

#### 1.2 Update Types
**File**: `/types/index.ts`

**Task**: Add type export for image update

```typescript
export type IUserImageUpdate = z.infer<typeof UserImageUpdateSchema>
```

**Why**: Provides type safety across the application.

---

#### 1.3 Create Server Action
**File**: `/lib/actions/user.actions.ts`

**Task**: Add `updateUserImage` function

```typescript
export async function updateUserImage(image: string) {
  try {
    // 1. Validate input
    const validatedData = UserImageUpdateSchema.parse({ image });
    
    // 2. Get authenticated user
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    // 3. Connect to database
    await connectToDatabase();

    // 4. Find and update user
    const user = await User.findById(session.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    // 5. Update image field
    user.image = validatedData.image;
    await user.save();

    // 6. Revalidate cache
    revalidatePath("/account");
    revalidatePath("/account/manage");

    return {
      success: true,
      message: "Profile picture updated successfully",
      data: user.image,
    };
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error) 
    };
  }
}
```

**Why**: Secure server-side function that:
- Validates input data
- Ensures user is authenticated
- Only allows users to update their own image
- Properly revalidates Next.js cache

---

#### 1.4 (Optional) Add Delete Image Action
**File**: `/lib/actions/user.actions.ts`

**Task**: Add `removeUserImage` function

```typescript
export async function removeUserImage() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Authentication required");
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      throw new Error("User not found");
    }

    user.image = undefined; // or empty string ""
    await user.save();

    revalidatePath("/account");
    revalidatePath("/account/manage");

    return {
      success: true,
      message: "Profile picture removed successfully",
    };
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error) 
    };
  }
}
```

**Why**: Allows users to remove their profile picture and revert to initials.

---

### **Phase 2: Frontend - Profile Picture Upload Component** 🎨

#### 2.1 Create Profile Picture Upload Component
**File**: `/components/shared/account/profile-picture-upload.tsx` (NEW)

**Task**: Create reusable profile picture upload component

```typescript
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadButton } from '@/lib/uploadthing'
import { useToast } from '@/hooks/use-toast'
import { updateUserImage, removeUserImage } from '@/lib/actions/user.actions'
import { Upload, X, Camera } from 'lucide-react'

interface ProfilePictureUploadProps {
  currentImage?: string
  userName: string
}

export default function ProfilePictureUpload({
  currentImage,
  userName,
}: ProfilePictureUploadProps) {
  const [image, setImage] = useState(currentImage || '')
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRemoveImage = async () => {
    setIsRemoving(true)
    try {
      const result = await removeUserImage()
      if (result.success) {
        setImage('')
        toast({
          description: result.message,
        })
        router.refresh()
      } else {
        toast({
          variant: 'destructive',
          description: result.message,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to remove profile picture',
      })
    } finally {
      setIsRemoving(false)
    }
  }

  const getInitials = () => {
    return userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950">
            <Camera className="h-4 w-4 text-blue-600" />
          </div>
          Profile Picture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Picture Preview */}
        <div className="flex items-center gap-6">
          <Avatar className="w-24 h-24">
            {image ? (
              <AvatarImage src={image} alt={userName} />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-2xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="text-sm font-medium">
              {image ? 'Update your profile picture' : 'Add a profile picture'}
            </div>
            <div className="text-xs text-muted-foreground">
              Recommended: Square image, at least 200x200px, max 4MB
            </div>
          </div>
        </div>

        {/* Upload/Remove Actions */}
        <div className="space-y-3">
          {image ? (
            <div className="flex gap-2">
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={async (res) => {
                  setIsUploading(true)
                  try {
                    const result = await updateUserImage(res[0].url)
                    if (result.success) {
                      setImage(res[0].url)
                      toast({
                        description: result.message,
                      })
                      router.refresh()
                    } else {
                      toast({
                        variant: 'destructive',
                        description: result.message,
                      })
                    }
                  } catch (error) {
                    toast({
                      variant: 'destructive',
                      description: 'Failed to update profile picture',
                    })
                  } finally {
                    setIsUploading(false)
                  }
                }}
                onUploadError={(error) => {
                  toast({
                    variant: 'destructive',
                    description: `Upload failed: ${error.message}`,
                  })
                }}
                appearance={{
                  button: "ut-ready:bg-primary ut-uploading:bg-primary/50 text-sm",
                  allowedContent: "hidden"
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleRemoveImage}
                disabled={isRemoving || isUploading}
              >
                <X className="h-4 w-4 mr-2" />
                {isRemoving ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Upload profile picture</div>
                  <div className="text-xs text-muted-foreground mb-4">
                    PNG or JPG format, max 4MB
                  </div>
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={async (res) => {
                      setIsUploading(true)
                      try {
                        const result = await updateUserImage(res[0].url)
                        if (result.success) {
                          setImage(res[0].url)
                          toast({
                            description: result.message,
                          })
                          router.refresh()
                        } else {
                          toast({
                            variant: 'destructive',
                            description: result.message,
                          })
                        }
                      } catch (error) {
                        toast({
                          variant: 'destructive',
                          description: 'Failed to update profile picture',
                        })
                      } finally {
                        setIsUploading(false)
                      }
                    }}
                    onUploadError={(error) => {
                      toast({
                        variant: 'destructive',
                        description: `Upload failed: ${error.message}`,
                      })
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Guidelines */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Guidelines:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use a clear photo of your face</li>
            <li>Square aspect ratio works best</li>
            <li>Avoid blurry or pixelated images</li>
            <li>Professional photos recommended</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Key Features**:
- ✅ Shows current profile picture or initials
- ✅ Upload button with proper error handling
- ✅ Remove button to revert to initials
- ✅ Loading states for better UX
- ✅ Toast notifications for success/error
- ✅ Follows existing brand-form pattern
- ✅ Responsive design

---

### **Phase 3: UI Integration** 🖼️

#### 3.1 Update Settings/Manage Page
**File**: `/app/[locale]/(root)/account/manage/page.tsx`

**Task**: Add ProfilePictureUpload component

**Changes**:
1. Import the new component:
```typescript
import ProfilePictureUpload from '@/components/shared/account/profile-picture-upload'
```

2. Add it above or below the existing cards:
```typescript
<div className='space-y-6'>
  {/* Profile Picture Section */}
  <ProfilePictureUpload 
    currentImage={session?.user?.image || undefined}
    userName={session?.user?.name || 'User'}
  />

  {/* Existing Name Card */}
  <Card>
    {/* ... existing name edit card ... */}
  </Card>

  {/* Existing Email Card */}
  <Card>
    {/* ... existing email card ... */}
  </Card>

  {/* Existing Security Card */}
  <Card>
    {/* ... existing security settings ... */}
  </Card>
</div>
```

**Why**: Logical placement in settings page where users manage their profile information.

---

#### 3.2 Update Account Layout (Sidebar Avatar)
**File**: `/app/[locale]/(root)/account/layout.tsx`

**Task**: Update avatar to use actual profile picture

**Current Code**:
```typescript
<Avatar className='w-12 h-12'>
  <AvatarFallback className='bg-primary text-primary-foreground font-semibold'>
    {initials}
  </AvatarFallback>
</Avatar>
```

**Updated Code**:
```typescript
<Avatar className='w-12 h-12'>
  {session.user.image && (
    <AvatarImage src={session.user.image} alt={session.user.name} />
  )}
  <AvatarFallback className='bg-primary text-primary-foreground font-semibold'>
    {initials}
  </AvatarFallback>
</Avatar>
```

**Why**: Displays the uploaded profile picture in the sidebar navigation, with automatic fallback to initials if no image exists.

---

#### 3.3 (Optional) Update Overview Page
**File**: `/app/[locale]/(root)/account/page.tsx`

**Task**: Add profile picture to overview page

**Changes**:
Add a profile section at the top:

```typescript
<div className='space-y-6'>
  {/* Profile Header */}
  <Card>
    <CardContent className='p-6'>
      <div className='flex items-center gap-4'>
        <Avatar className='w-20 h-20'>
          {session.user.image && (
            <AvatarImage src={session.user.image} alt={session.user.name} />
          )}
          <AvatarFallback className='bg-primary text-primary-foreground font-semibold text-2xl'>
            {session.user.name
              ? session.user.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
              : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className='flex-1'>
          <h2 className='text-2xl font-bold'>{session.user.name}</h2>
          <p className='text-muted-foreground'>{session.user.email}</p>
          <Link 
            href='/account/manage' 
            className='text-sm text-primary hover:underline mt-1 inline-block'
          >
            Edit profile →
          </Link>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Existing Overview Information */}
  <div>
    <h1 className='text-3xl font-bold'>Overview</h1>
    {/* ... rest of existing content ... */}
  </div>
</div>
```

**Why**: Shows a professional profile header with the profile picture prominently displayed.

---

### **Phase 4: Enhanced Features (Optional)** ⚡

#### 4.1 Image Cropper
**Library**: `react-easy-crop` or `react-image-crop`

**Task**: Add image cropping before upload

**Why**: Ensures all profile pictures are properly squared and centered.

**Implementation**:
1. Install: `npm install react-easy-crop`
2. Create cropper modal component
3. Integrate before UploadButton
4. Crop image client-side, then upload

---

#### 4.2 Optimistic UI Updates
**Task**: Show image immediately before server confirmation

**Implementation**:
```typescript
// In ProfilePictureUpload component
const [optimisticImage, setOptimisticImage] = useState('')

onClientUploadComplete={async (res) => {
  // Show immediately
  setOptimisticImage(res[0].url)
  
  // Then save to server
  const result = await updateUserImage(res[0].url)
  
  if (result.success) {
    setImage(res[0].url)
  } else {
    // Revert on error
    setOptimisticImage('')
  }
}}
```

**Why**: Better perceived performance.

---

#### 4.3 Image Validation
**Task**: Validate image dimensions and aspect ratio client-side

**Implementation**:
```typescript
const validateImage = (file: File) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      if (img.width < 200 || img.height < 200) {
        reject('Image must be at least 200x200px')
      }
      resolve(true)
    }
  })
}
```

**Why**: Prevents users from uploading low-quality images.

---

#### 4.4 Multiple Upload Options
**Task**: Support upload from:
- Local file
- Webcam
- URL

**Libraries**:
- `react-webcam` for webcam capture
- Custom input for URL

---

### **Phase 5: Testing & Polish** ✅

#### 5.1 Manual Testing Checklist
- [ ] Upload new profile picture
- [ ] Remove profile picture
- [ ] Upload oversized image (>4MB) - should show error
- [ ] Upload non-image file - should show error
- [ ] Check image displays in sidebar
- [ ] Check image displays in overview page
- [ ] Test on mobile devices
- [ ] Test slow network (3G)
- [ ] Test upload interruption
- [ ] Verify database updates correctly

---

#### 5.2 Error Handling
Ensure proper error messages for:
- [ ] File too large
- [ ] Invalid file type
- [ ] Network errors
- [ ] Server errors
- [ ] Authentication errors

---

#### 5.3 Performance Optimization
- [ ] Lazy load profile pictures
- [ ] Use Next.js Image optimization
- [ ] Add loading skeletons
- [ ] Implement image caching strategy

---

#### 5.4 Accessibility
- [ ] Add proper alt text
- [ ] Keyboard navigation support
- [ ] Screen reader announcements
- [ ] Focus management

---

## 📦 Dependencies

**Already Installed**:
- ✅ uploadthing
- ✅ @uploadthing/react
- ✅ next
- ✅ react-hook-form
- ✅ zod

**Optional (for Phase 4)**:
- react-easy-crop (image cropping)
- react-webcam (webcam capture)

---

## 🗂️ File Structure

```
project-root/
├── app/
│   ├── api/
│   │   └── uploadthing/
│   │       ├── core.ts (✅ existing)
│   │       └── route.ts (✅ existing)
│   └── [locale]/
│       └── (root)/
│           └── account/
│               ├── layout.tsx (📝 update)
│               ├── page.tsx (📝 update - optional)
│               └── manage/
│                   └── page.tsx (📝 update)
├── components/
│   └── shared/
│       └── account/
│           └── profile-picture-upload.tsx (🆕 create)
├── lib/
│   ├── actions/
│   │   └── user.actions.ts (📝 update)
│   ├── db/
│   │   └── models/
│   │       └── user.model.ts (✅ existing - has image field)
│   ├── uploadthing.ts (✅ existing)
│   └── validator.ts (📝 update)
└── types/
    └── index.ts (📝 update)
```

Legend:
- ✅ Already exists, no changes needed
- 📝 Needs to be updated
- 🆕 New file to create

---

## 🎯 Implementation Order Summary

### Quick Start (Minimal Viable Feature):
1. ✅ Add `UserImageUpdateSchema` to validator
2. ✅ Add `updateUserImage` action
3. ✅ Create `ProfilePictureUpload` component
4. ✅ Add component to `/account/manage` page
5. ✅ Update sidebar avatar in layout

**Estimated Time**: 2-3 hours

### Full Feature (Recommended):
1. Complete Quick Start (above)
2. Add `removeUserImage` action
3. Update overview page with profile header
4. Add comprehensive error handling
5. Test on multiple devices
6. Add loading states and optimistic updates

**Estimated Time**: 4-6 hours

### Enhanced (Optional):
1. Complete Full Feature (above)
2. Add image cropper
3. Add webcam support
4. Add client-side validation
5. Optimize performance

**Estimated Time**: Additional 3-4 hours

---

## 🚀 Getting Started

**Step 1**: Start with Phase 1 (Backend)
- Create validation schema
- Add server actions
- Test with simple curl/Postman

**Step 2**: Build Phase 2 (Component)
- Create ProfilePictureUpload component
- Test in isolation with mock data

**Step 3**: Integrate Phase 3 (UI)
- Add to manage page
- Update layout
- Test end-to-end

**Step 4**: Polish Phase 5 (Testing)
- Run manual tests
- Fix bugs
- Optimize performance

---

## 📚 Reference Implementation

Look at these existing files for patterns:
- `/app/[locale]/admin/brands/brand-form.tsx` - Image upload pattern
- `/lib/actions/user.actions.ts` - User update pattern
- `/components/ui/avatar.tsx` - Avatar component usage

---

## 🔒 Security Considerations

1. **Authentication**: ✅ Already handled by middleware in uploadthing core
2. **Authorization**: ✅ Users can only update their own image
3. **File Type Validation**: ✅ Handled by uploadthing config (image only)
4. **File Size Limit**: ✅ Set to 4MB in uploadthing config
5. **URL Validation**: ✅ Zod schema validates URL format
6. **XSS Protection**: ✅ Next.js Image component sanitizes URLs

---

## 💡 Tips & Best Practices

1. **Always show loading states** - Uploads can take time
2. **Provide visual feedback** - Toast notifications for success/error
3. **Optimize images** - Use Next.js Image component
4. **Handle errors gracefully** - Network issues are common
5. **Test on real devices** - Simulators don't catch everything
6. **Keep it simple first** - Start with basic upload, add features later
7. **Revalidate cache** - Use `router.refresh()` after updates
8. **Follow existing patterns** - Consistency with brand-form approach

---

## 🎉 Success Criteria

Feature is complete when:
- [ ] Users can upload profile pictures
- [ ] Users can remove profile pictures
- [ ] Pictures display in sidebar navigation
- [ ] Pictures display in account pages
- [ ] Proper error handling for all scenarios
- [ ] Mobile-responsive design
- [ ] Loading states work correctly
- [ ] Database updates persist correctly
- [ ] No console errors or warnings

---

## 📞 Troubleshooting

**Upload button not showing?**
- Check UploadThing API keys in `.env`
- Verify uploadthing endpoint is running
- Check browser console for errors

**Image not updating?**
- Check revalidatePath is called
- Try hard refresh (Ctrl+Shift+R)
- Check database to confirm update

**Upload fails silently?**
- Check file size (must be < 4MB)
- Check file type (must be image)
- Check network tab for failed requests
- Check server logs for errors

---

**Let me know when you're ready to start implementation!** 🚀

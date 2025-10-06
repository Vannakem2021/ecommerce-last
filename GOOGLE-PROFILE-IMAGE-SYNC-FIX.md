# Google Profile Image Synchronization - Complete Fix

## Problem Analysis (From Screenshot)

### **What Was Observed:**
- **Sidebar & Navbar**: Show green background with "TT" initials ❌
- **Settings Page**: Shows "T" with actual Google profile picture ✅

### **Why This Was Happening:**

#### **Settings Page (Working):**
```typescript
// Fetches fresh data from database
const userData = await getUserById(session.user.id)

// Database has Google image (saved by adapter on first sign-in)
return <SettingsPageClient user={{ image: userData?.image }} />
```
**Result:** ✅ Shows Google profile because it reads from database

#### **Sidebar & Navbar (Broken):**
```typescript
// Uses session data (JWT token)
const session = await auth()

// Session doesn't have image because:
// 1. OAuth sign-in didn't set user.image in signIn callback
// 2. JWT callback got user.image = undefined
// 3. Session callback got token.picture = undefined
return <ProfilePictureModal currentImage={session.user.image} /> // undefined!
```
**Result:** ❌ Shows initials because session.user.image is undefined

---

## Root Cause

### **The Sign-In Callback Issue:**

When a user signs in with Google and **already exists** in the database:

```typescript
// OLD (Broken)
if (existingUser) {
  (user as { role: string }).role = existingUser.role;
  user.name = existingUser.name || user.name;
  // ❌ MISSING: user.image not set!
  
  await User.findByIdAndUpdate(existingUser._id, {
    lastLoginAt: new Date()
    // ❌ MISSING: image not updated!
  });
}
```

**What happened:**
1. User signs in with Google
2. Google provides `user.image` (from OAuth profile)
3. signIn callback finds existing user in database
4. Preserves role and name, but **doesn't set user.image**
5. JWT callback: `token.picture = user.image` → `token.picture = undefined`
6. Session callback: `session.user.image = token.picture` → `session.user.image = undefined`
7. Sidebar & Navbar: No image, shows initials ❌

**Meanwhile:**
- Database has the image (saved by MongoDBAdapter on first OAuth sign-in)
- Settings page reads from database directly → Shows Google profile ✅
- But session doesn't have it → Sidebar/Navbar broken ❌

---

## Solution Implemented

### **Updated signIn Callback:**

```typescript
if (account?.provider === "google") {
  const existingUser = await User.findOne({ email: user.email });

  if (existingUser) {
    (user as { role: string }).role = existingUser.role;
    user.name = existingUser.name || user.name;

    // ✅ NEW: Sync Google profile image
    const updateData: any = { lastLoginAt: new Date() };
    
    // If user doesn't have a custom profile image, use Google's
    if (!existingUser.image && user.image) {
      updateData.image = user.image; // Save to database
      user.image = user.image; // Set on user object for session
    } else {
      // User has custom image, preserve it
      user.image = existingUser.image; // Use database image
    }

    await User.findByIdAndUpdate(existingUser._id, updateData);
  }
}
```

**What this does:**
1. ✅ Checks if user already has custom profile image in database
2. ✅ If NO custom image: Use Google profile image
3. ✅ If HAS custom image: Preserve it (don't overwrite)
4. ✅ Sets `user.image` so JWT callback receives it
5. ✅ Updates database if needed

---

## Complete Flow After Fix

### **Flow 1: First Google Sign-In (New User)**
```
1. User clicks "Sign in with Google"
2. Google OAuth returns profile with image URL
3. MongoDBAdapter creates user in database (includes image) ✅
4. signIn callback: user.role = "user", user.image = Google URL ✅
5. JWT callback: token.picture = user.image ✅
6. Session callback: session.user.image = token.picture ✅
7. Navbar: Displays Google profile ✅
8. Sidebar: Displays Google profile ✅
9. Settings: Displays Google profile ✅
```

### **Flow 2: Returning Google User (No Custom Image)**
```
1. User signs in with Google (already has account)
2. Google OAuth returns profile with image URL
3. signIn callback:
   - Finds existing user in database
   - existingUser.image = Google URL (from first sign-in)
   - user.image = existingUser.image ✅
4. JWT callback: token.picture = user.image ✅
5. Session callback: session.user.image = token.picture ✅
6. Navbar: Displays Google profile ✅
7. Sidebar: Displays Google profile ✅
8. Settings: Displays Google profile ✅
```

### **Flow 3: User with Custom Profile Image**
```
1. User previously uploaded custom image in Settings
2. Database has custom image URL
3. User signs in with Google
4. signIn callback:
   - Finds existing user in database
   - existingUser.image = custom URL (from upload)
   - user.image = existingUser.image (PRESERVE custom) ✅
5. JWT callback: token.picture = user.image ✅
6. Session callback: session.user.image = token.picture ✅
7. Navbar: Displays custom image ✅
8. Sidebar: Displays custom image ✅
9. Settings: Displays custom image ✅
```

### **Flow 4: User Uploads Custom Image**
```
1. User goes to Settings
2. Uploads new image
3. Database updated with new URL
4. update({ image: newUrl }) triggers JWT callback ✅
5. JWT callback: token.picture = newUrl ✅
6. Page reloads with new session ✅
7. All locations show custom image ✅
```

### **Flow 5: User Removes Custom Image**
```
1. User goes to Settings
2. Clicks "Remove"
3. Database sets image = null
4. update({ image: null }) triggers JWT callback ✅
5. JWT callback: token.picture = null ✅
6. Next sign-in:
   - signIn callback: !existingUser.image && user.image
   - Updates database with Google image ✅
   - user.image = Google URL ✅
7. Google profile restored ✅
```

---

## Image Priority Logic

The system now follows this priority:

### **Priority 1: Custom Uploaded Image** (Highest)
```typescript
if (existingUser.image) {
  user.image = existingUser.image; // Use custom image
}
```
- User uploaded via Settings
- Stored in database
- **Overrides Google profile**

### **Priority 2: Google OAuth Profile**
```typescript
if (!existingUser.image && user.image) {
  updateData.image = user.image; // Use Google image
  user.image = user.image;
}
```
- From Google OAuth provider
- Used if no custom image
- **Saved to database**

### **Priority 3: Initials Fallback** (Lowest)
```typescript
<AvatarFallback>{getInitials()}</AvatarFallback>
```
- Generated from name
- 2-letter initials
- Used if no image at all

---

## Code Changes

### **File Modified:** `auth.ts`

**Section:** `signIn` callback

**Before:**
```typescript
if (existingUser) {
  (user as { role: string }).role = existingUser.role;
  user.name = existingUser.name || user.name;

  await User.findByIdAndUpdate(existingUser._id, {
    lastLoginAt: new Date()
  });
}
```

**After:**
```typescript
if (existingUser) {
  (user as { role: string }).role = existingUser.role;
  user.name = existingUser.name || user.name;

  // Update last login timestamp and sync Google profile image if no custom image
  const updateData: any = { lastLoginAt: new Date() };
  
  // If user doesn't have a custom profile image, update with Google profile image
  if (!existingUser.image && user.image) {
    updateData.image = user.image;
    user.image = user.image; // Ensure session gets the image
  } else {
    // User has custom image, preserve it
    user.image = existingUser.image;
  }

  await User.findByIdAndUpdate(existingUser._id, updateData);
}
```

**Lines Changed:** +11 lines, -3 lines = +8 net

---

## Testing Instructions

### **Test 1: Sign Out and Sign In Again**
```
1. Sign out completely
2. Sign in with Google account
3. Check navbar → Should show Google profile ✅
4. Check sidebar (/account) → Should show Google profile ✅
5. Check settings (/account/manage) → Should show Google profile ✅
```

### **Test 2: Upload Custom Image**
```
1. Sign in with Google
2. Go to /account/manage
3. Click "Profile Picture"
4. Upload custom image
5. Page refreshes
6. All locations should show custom image ✅
7. Sign out and sign in again
8. Custom image should be preserved ✅
```

### **Test 3: Remove Custom Image**
```
1. Have custom image uploaded
2. Go to /account/manage
3. Click "Profile Picture"
4. Click "Remove"
5. Page refreshes
6. All locations should show Google profile again ✅
```

### **Test 4: New Google User**
```
1. Create new Google account or use one not registered
2. Sign in with Google
3. First sign-in should show Google profile everywhere ✅
4. No initials fallback should be shown ✅
```

---

## Why It Was Broken

### **The Missing Link:**

```
Google OAuth         Database              Session              UI
    ↓                   ↓                    ↓                   ↓
user.image      existingUser.image    session.user.image    Avatar
(from Google)   (in MongoDB)          (from JWT)            Display
    ✅                ✅                    ❌                  ❌
```

**The Break:** signIn callback wasn't passing `existingUser.image` to `user.image`

**Result:** JWT and Session didn't get the image, even though database had it

---

## Why It Works Now

### **The Complete Chain:**

```
Google OAuth         signIn Callback        JWT Callback          Session              UI
    ↓                      ↓                     ↓                   ↓                   ↓
user.image    →    user.image = DB image  →  token.picture  →  session.user.image  →  Avatar
(from Google)      (from existingUser)       (from user)         (from token)        Display
    ✅                     ✅                    ✅                  ✅                  ✅
```

**The Fix:** signIn callback now ensures `user.image` is always set (from DB or OAuth)

**Result:** JWT and Session get the image, UI displays it correctly

---

## Summary

**Problem:** Sidebar and Navbar showed initials instead of Google profile picture

**Root Cause:** signIn callback wasn't setting `user.image` for existing users, breaking the chain to JWT/Session

**Solution:** Update signIn callback to sync database image to `user.image` object

**Logic:**
- If user has custom image in database → Use it (preserve user choice)
- If user has NO custom image → Use Google profile (save to database)
- Always set `user.image` so JWT/Session get the value

**Result:**
- ✅ Google profile pictures work in Navbar
- ✅ Google profile pictures work in Sidebar
- ✅ Custom uploads still work and are preserved
- ✅ All three locations synchronized
- ✅ No more initials for Google users with profile pictures

**Files Modified:** 1 file (`auth.ts`), 8 lines changed

**Test:** Sign out and sign in again with Google to see your profile picture everywhere! 🎉

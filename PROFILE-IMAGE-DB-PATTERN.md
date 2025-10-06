# Profile Image - Database Pattern Solution

## Problem Solved

Settings page showed Google profile ✅ but Sidebar/Navbar showed initials ❌

## Root Cause

**Different data sources:**
- **Settings page**: Fetches from database using `getUserById()` ✅
- **Sidebar/Navbar**: Used session data which wasn't syncing ❌

## Solution: Use Same Pattern Everywhere

### **What Settings Does (Working):**

```typescript
// app/[locale]/(root)/account/manage/page.tsx
const userData = await getUserById(session.user.id)

return (
  <SettingsPageClient 
    user={{
      image: userData?.image,  // ← From database
      ...
    }}
  />
)
```

### **What We Changed:**

#### **1. Account Layout (Sidebar):**

**Before:**
```typescript
// Used session directly
<AccountSidebarContent session={session} navItems={navItems} />
```

**After:**
```typescript
// Fetch from database like Settings
const userData = await getUserById(session.user.id)

const enhancedSession = {
  ...session,
  user: {
    ...session.user,
    image: userData?.image || session.user.image, // Database first!
  }
}

<AccountSidebarContent session={enhancedSession} navItems={navItems} />
```

#### **2. UserButton (Navbar):**

**Before:**
```typescript
const session = await auth()

<UserAvatar user={session.user} />
```

**After:**
```typescript
const session = await auth()

// Fetch from database like Settings
const userData = await getUserById(session.user.id)
const userImage = userData?.image || session?.user?.image

<UserAvatar 
  user={{
    name: session.user.name,
    image: userImage, // Database image!
  }} 
/>
```

---

## Why This Works

### **Database as Source of Truth:**

```
Google Sign-In
      ↓
MongoDB Adapter saves image to database ✅
      ↓
getUserById() reads from database ✅
      ↓
Component displays image ✅
```

### **Session Issues:**

```
Google Sign-In
      ↓
Session created with image
      ↓
But session cache issues ❌
      ↓
Components show stale data ❌
```

---

## Files Modified

### **1. Account Layout** (`app/[locale]/(root)/account/layout.tsx`)

```typescript
import { getUserById } from '@/lib/actions/user.actions'

export default async function AccountLayout({ children }) {
  const session = await auth()
  
  // ✅ Fetch from database (same as Settings)
  const userData = await getUserById(session.user.id)

  // ✅ Create enhanced session with database image
  const enhancedSession = {
    ...session,
    user: {
      ...session.user,
      image: userData?.image || session.user.image,
      createdAt: userData?.createdAt || session.user.createdAt,
    }
  }

  return (
    <>
      <MobileAccountHeader session={enhancedSession} />
      <AccountSidebarContent session={enhancedSession} />
      {children}
    </>
  )
}
```

### **2. UserButton** (`components/shared/header/user-button.tsx`)

```typescript
import { getUserById } from '@/lib/actions/user.actions'

export default async function UserButton() {
  const session = await auth()
  
  // ✅ Fetch from database (same as Settings)
  let userData = null
  if (session?.user?.id) {
    userData = await getUserById(session.user.id)
  }

  // ✅ Use database image
  const userImage = userData?.image || session?.user?.image

  return (
    <UserAvatar 
      user={{
        name: session.user.name,
        image: userImage, // Database image
      }}
    />
  )
}
```

---

## Benefits

### **1. Consistency:**
- ✅ All pages use same data source (database)
- ✅ No session sync issues
- ✅ Always fresh data

### **2. Reliability:**
- ✅ Database is source of truth
- ✅ No cache issues
- ✅ No session staleness

### **3. Simplicity:**
- ✅ Same pattern everywhere
- ✅ Easy to understand
- ✅ Easy to maintain

---

## How It Works Now

### **Flow 1: Google Sign-In**
```
1. User signs in with Google
2. MongoDBAdapter saves image to database ✅
3. All components fetch from database ✅
4. All show Google profile ✅
```

### **Flow 2: Upload Custom Image**
```
1. User uploads in Settings
2. Database updated ✅
3. All components fetch from database ✅
4. All show custom image ✅
```

### **Flow 3: Remove Image**
```
1. User removes in Settings
2. Database set to null ✅
3. All components fetch from database ✅
4. Google users: Adapter has Google image, shows it ✅
5. Other users: Shows initials ✅
```

---

## Testing

### **Test 1: Refresh Page**
```
1. Refresh page (F5)
2. Check sidebar → Should show Google profile ✅
3. Check navbar → Should show Google profile ✅
4. Check settings → Should show Google profile ✅
```

### **Test 2: Navigate Between Pages**
```
1. Go to /account
2. Sidebar shows Google profile ✅
3. Go to /account/orders
4. Sidebar still shows Google profile ✅
5. Navbar always shows Google profile ✅
```

### **Test 3: Upload Custom Image**
```
1. Go to Settings
2. Upload custom image
3. Page refreshes
4. All locations show custom image ✅
```

---

## Console Logs

You should see:

```
[UserButton] Using database image: {
  sessionImage: 'https://lh3.googleusercontent.com/...',
  databaseImage: 'https://lh3.googleusercontent.com/...',
  finalImage: 'https://lh3.googleusercontent.com/...',
  hasImage: true ✅
}
```

---

## Summary

**Problem:** Session-based approach had sync issues

**Solution:** Use database-based approach like Settings page

**Pattern:**
```typescript
// Step 1: Fetch from database
const userData = await getUserById(session.user.id)

// Step 2: Use database image
const userImage = userData?.image || session?.user?.image

// Step 3: Pass to component
<Component user={{ image: userImage }} />
```

**Result:** All three locations (Settings, Sidebar, Navbar) now use the same reliable pattern! ✅

**Just refresh the page and your Google profile should appear everywhere!** 🎉

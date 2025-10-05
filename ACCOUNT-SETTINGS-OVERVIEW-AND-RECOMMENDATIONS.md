# Account Settings - Current Implementation & Recommendations

## 📋 Current Implementation Overview

### **Account Section Structure**

```
/account/
├── Overview (page.tsx)
├── My Orders (orders/page.tsx)
├── Addresses (addresses/page.tsx)
└── Settings (manage/page.tsx)
    └── Change Name (manage/name/page.tsx)
```

---

## 🔍 Current Features Analysis

### **1. Overview Page** (`/account`)
**Current Features:**
- ✅ Profile header with clickable avatar
- ✅ Profile picture upload via modal
- ✅ Display: Name, Email, Phone (if exists), Member Since, Account Status
- ✅ Quick link to settings

**What's Good:**
- Clean, informative layout
- Clickable avatar with clear hint
- Read-only information display

**What's Missing:**
- No quick actions (e.g., recent orders, quick stats)
- No personalization (e.g., greeting)
- Static information only

---

### **2. Settings Page** (`/account/manage` - "Login & Security")
**Current Features:**
- ✅ Name editing (redirects to `/account/manage/name`)
- ✅ Email display with "Verified" badge
- ✅ Password status badge (static)
- ✅ Two-Factor Authentication (Coming Soon)
- ✅ Login Activity (disabled)

**What's Good:**
- Clear separation of sections
- Name editing works properly
- Email verification status shown

**What's Missing:**
- ❌ No actual password change functionality
- ❌ No email change functionality
- ❌ No phone number management
- ❌ No account deletion option
- ❌ No session management (logout other devices)
- ❌ No notification preferences
- ❌ No privacy settings
- ❌ No language/timezone preferences
- ❌ Placeholder features marked as "Coming Soon"

---

### **3. Name Edit Page** (`/account/manage/name`)
**Current Features:**
- ✅ Form to update name
- ✅ Validation with Zod
- ✅ Session update on success
- ✅ Toast notifications
- ✅ Redirect back to settings

**What's Good:**
- Fully functional
- Good UX with form validation
- Proper session management

---

### **4. Addresses Page** (`/account/addresses`)
**Current Features:**
- ✅ Address management
- ✅ Full CRUD functionality

**What's Good:**
- Complete implementation
- Separate from settings (appropriate)

---

### **5. Orders Page** (`/account/orders`)
**Current Features:**
- ✅ Order listing
- ✅ Order details
- ✅ Invoice generation

**What's Good:**
- Complete implementation
- Professional table view

---

## 🎯 Recommendations for Improvement

### **Priority 1: Critical Missing Features** ⭐⭐⭐

#### **1.1 Password Change Functionality**
**Current:** Shows "Secure" badge but no way to change password  
**Recommendation:** Add password change page

**Implementation:**
```tsx
// File: /account/manage/password/page.tsx
- Current password input (with visibility toggle)
- New password input (with strength meter)
- Confirm new password
- Password requirements checklist
- "Update Password" button
```

**Action needed:**
```typescript
// lib/actions/user.actions.ts
export async function updateUserPassword(data: {
  currentPassword: string
  newPassword: string
}) {
  // 1. Verify current password
  // 2. Hash new password
  // 3. Update in database
  // 4. Send email notification
  // 5. Optional: Logout other sessions
}
```

---

#### **1.2 Email Change Functionality**
**Current:** Shows email but no way to change it  
**Recommendation:** Add email change with verification

**Implementation:**
```tsx
// File: /account/manage/email/page.tsx
- Current email display
- New email input
- Verification code sent to new email
- Confirmation step
```

**Flow:**
1. User enters new email
2. Send verification code to new email
3. User enters code
4. Update email in database
5. Send notification to old email
6. Update session

---

#### **1.3 Phone Number Management**
**Current:** Shows phone if exists, but no way to add/edit/remove  
**Recommendation:** Add phone management

**Implementation:**
```tsx
// File: /account/manage/phone/page.tsx
- Phone input with country code selector
- SMS verification (optional)
- Remove phone option
```

---

#### **1.4 Account Deletion**
**Current:** No way to delete account  
**Recommendation:** Add account deletion with safeguards

**Implementation:**
```tsx
// Add to Settings page
<Card>
  <CardContent className='p-4'>
    <h3 className='font-bold text-red-600'>Danger Zone</h3>
    <p className='text-sm text-gray-600 mt-2'>
      Once you delete your account, there is no going back. Please be certain.
    </p>
    <Button variant='destructive' className='mt-4'>
      Delete Account
    </Button>
  </CardContent>
</Card>
```

**Flow:**
1. User clicks "Delete Account"
2. Modal opens with warnings
3. User types account email to confirm
4. User enters password
5. Final confirmation
6. Account marked as deleted (soft delete)
7. Logout and redirect

---

### **Priority 2: Security Enhancements** ⭐⭐⭐

#### **2.1 Two-Factor Authentication (2FA)**
**Current:** Shows "Coming Soon"  
**Recommendation:** Implement TOTP-based 2FA

**Implementation:**
```tsx
// File: /account/manage/2fa/page.tsx
Features:
- Enable/Disable 2FA
- QR code generation (using speakeasy or otpauth)
- Backup codes generation (10 codes)
- Download/Print backup codes
- Recovery options
```

**Libraries needed:**
- `speakeasy` - TOTP generation
- `qrcode` - QR code generation

---

#### **2.2 Active Sessions Management**
**Current:** No session visibility  
**Recommendation:** Show active sessions with logout options

**Implementation:**
```tsx
// Add to Settings page
<Card>
  <CardContent className='p-4'>
    <h3 className='font-bold mb-4'>Active Sessions</h3>
    <div className='space-y-3'>
      {sessions.map(session => (
        <div key={session.id} className='flex justify-between items-center border-b pb-3'>
          <div>
            <div className='font-medium'>
              {session.device} • {session.browser}
            </div>
            <div className='text-sm text-gray-600'>
              {session.location} • Last active {formatDate(session.lastActive)}
            </div>
          </div>
          <Button 
            variant='outline' 
            size='sm'
            onClick={() => revokeSession(session.id)}
          >
            Revoke
          </Button>
        </div>
      ))}
    </div>
    <Button variant='destructive' className='mt-4 w-full'>
      Logout All Other Sessions
    </Button>
  </CardContent>
</Card>
```

**Data needed:**
- Session tokens stored in database
- Device detection (user-agent parsing)
- IP-based location (optional)
- Last activity timestamp

---

#### **2.3 Login History/Activity Log**
**Current:** Shows disabled button  
**Recommendation:** Implement login history tracking

**Implementation:**
```tsx
// File: /account/manage/activity/page.tsx
Features:
- Login attempts (successful and failed)
- IP addresses
- Locations
- Timestamps
- Device information
- Suspicious activity alerts
```

**Database:**
```typescript
// New collection: LoginHistory
{
  userId: ObjectId
  type: 'login' | 'failed_login' | 'logout' | 'password_change'
  ipAddress: string
  location: string // City, Country
  device: string
  browser: string
  timestamp: Date
  success: boolean
}
```

---

### **Priority 3: User Preferences** ⭐⭐

#### **3.1 Notification Preferences**
**Current:** No notification settings  
**Recommendation:** Add notification management

**Implementation:**
```tsx
// File: /account/manage/notifications/page.tsx
<Card>
  <CardContent className='p-4'>
    <h3 className='font-bold mb-4'>Email Notifications</h3>
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <div>
          <div className='font-medium'>Order Updates</div>
          <div className='text-sm text-gray-600'>
            Receive emails about your order status
          </div>
        </div>
        <Switch checked={prefs.orderUpdates} />
      </div>
      
      <div className='flex items-center justify-between'>
        <div>
          <div className='font-medium'>Promotions & Offers</div>
          <div className='text-sm text-gray-600'>
            Get exclusive deals and discounts
          </div>
        </div>
        <Switch checked={prefs.promotions} />
      </div>
      
      <div className='flex items-center justify-between'>
        <div>
          <div className='font-medium'>Product Recommendations</div>
          <div className='text-sm text-gray-600'>
            Personalized product suggestions
          </div>
        </div>
        <Switch checked={prefs.recommendations} />
      </div>
      
      <div className='flex items-center justify-between'>
        <div>
          <div className='font-medium'>Security Alerts</div>
          <div className='text-sm text-gray-600'>
            Important account security notifications
          </div>
        </div>
        <Switch checked={prefs.security} disabled />
        <span className='text-xs text-gray-500'>(Always on)</span>
      </div>
    </div>
  </CardContent>
</Card>
```

---

#### **3.2 Language & Region Settings**
**Current:** No language selection  
**Recommendation:** Add language/region preferences

**Implementation:**
```tsx
// Add to Settings page
<Card>
  <CardContent className='p-4'>
    <h3 className='font-bold mb-4'>Language & Region</h3>
    
    <div className='space-y-4'>
      <div>
        <label className='font-medium'>Language</label>
        <Select value={lang} onValueChange={setLang}>
          <SelectItem value='en'>English</SelectItem>
          <SelectItem value='kh'>ភាសាខ្មែរ (Khmer)</SelectItem>
        </Select>
      </div>
      
      <div>
        <label className='font-medium'>Currency</label>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectItem value='USD'>USD ($)</SelectItem>
          <SelectItem value='KHR'>KHR (៛)</SelectItem>
        </Select>
      </div>
      
      <div>
        <label className='font-medium'>Timezone</label>
        <Select value={timezone}>
          <SelectItem value='Asia/Phnom_Penh'>Phnom Penh (GMT+7)</SelectItem>
          <SelectItem value='UTC'>UTC</SelectItem>
        </Select>
      </div>
    </div>
  </CardContent>
</Card>
```

---

#### **3.3 Privacy Settings**
**Current:** No privacy controls  
**Recommendation:** Add privacy preferences

**Implementation:**
```tsx
// File: /account/manage/privacy/page.tsx
Features:
- Profile visibility (public/private)
- Search engine indexing
- Data collection preferences
- Third-party sharing options
- Marketing consent
- Download my data (GDPR)
- Delete my data request
```

---

### **Priority 4: Enhanced Overview Page** ⭐⭐

#### **4.1 Quick Stats Dashboard**
**Recommendation:** Add useful stats to overview page

```tsx
// Add to /account page (before Account Information)
<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
  <Card>
    <CardContent className='p-4'>
      <div className='flex items-center gap-3'>
        <div className='p-2 bg-blue-100 rounded-lg'>
          <Package className='w-5 h-5 text-blue-600' />
        </div>
        <div>
          <div className='text-2xl font-bold'>{stats.totalOrders}</div>
          <div className='text-xs text-gray-600'>Total Orders</div>
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className='p-4'>
      <div className='flex items-center gap-3'>
        <div className='p-2 bg-green-100 rounded-lg'>
          <DollarSign className='w-5 h-5 text-green-600' />
        </div>
        <div>
          <div className='text-2xl font-bold'>${stats.totalSpent}</div>
          <div className='text-xs text-gray-600'>Total Spent</div>
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className='p-4'>
      <div className='flex items-center gap-3'>
        <div className='p-2 bg-orange-100 rounded-lg'>
          <Clock className='w-5 h-5 text-orange-600' />
        </div>
        <div>
          <div className='text-2xl font-bold'>{stats.pendingOrders}</div>
          <div className='text-xs text-gray-600'>Pending</div>
        </div>
      </div>
    </CardContent>
  </Card>
  
  <Card>
    <CardContent className='p-4'>
      <div className='flex items-center gap-3'>
        <div className='p-2 bg-purple-100 rounded-lg'>
          <MapPin className='w-5 h-5 text-purple-600' />
        </div>
        <div>
          <div className='text-2xl font-bold'>{stats.addressCount}</div>
          <div className='text-xs text-gray-600'>Addresses</div>
        </div>
      </div>
    </CardContent>
  </Card>
</div>
```

---

#### **4.2 Recent Activity Widget**
**Recommendation:** Show recent account activity

```tsx
// Add to /account page
<Card>
  <CardContent className='p-6'>
    <h3 className='text-lg font-bold mb-4'>Recent Activity</h3>
    <div className='space-y-3'>
      {activities.map(activity => (
        <div key={activity.id} className='flex items-start gap-3 text-sm'>
          <div className='p-1.5 bg-gray-100 rounded-full'>
            {getActivityIcon(activity.type)}
          </div>
          <div className='flex-1'>
            <div className='font-medium'>{activity.description}</div>
            <div className='text-xs text-gray-600'>{formatDate(activity.date)}</div>
          </div>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

---

### **Priority 5: UX Improvements** ⭐

#### **5.1 Better Settings Navigation**
**Current:** Single page with all settings  
**Recommendation:** Create settings tabs/sidebar

```tsx
// Improved Settings Layout
<div className='flex gap-6'>
  {/* Settings Sidebar */}
  <aside className='w-64'>
    <nav className='space-y-1'>
      <Link href='/account/manage' className='...'>
        Profile
      </Link>
      <Link href='/account/manage/security' className='...'>
        Security
      </Link>
      <Link href='/account/manage/notifications' className='...'>
        Notifications
      </Link>
      <Link href='/account/manage/privacy' className='...'>
        Privacy
      </Link>
      <Link href='/account/manage/preferences' className='...'>
        Preferences
      </Link>
    </nav>
  </aside>
  
  {/* Settings Content */}
  <main className='flex-1'>
    {children}
  </main>
</div>
```

---

#### **5.2 Inline Editing for Simple Fields**
**Current:** Separate page for name editing  
**Recommendation:** Add inline editing for quick updates

```tsx
// Example: Inline name editing
const [isEditing, setIsEditing] = useState(false)

{isEditing ? (
  <div className='flex gap-2'>
    <Input value={name} onChange={(e) => setName(e.target.value)} />
    <Button onClick={saveName}>Save</Button>
    <Button variant='ghost' onClick={() => setIsEditing(false)}>
      Cancel
    </Button>
  </div>
) : (
  <div className='flex items-center gap-2'>
    <span>{name}</span>
    <Button variant='ghost' size='sm' onClick={() => setIsEditing(true)}>
      <Pencil className='w-4 h-4' />
    </Button>
  </div>
)}
```

---

#### **5.3 Progress Indicators**
**Recommendation:** Show profile completion progress

```tsx
// Add to Overview page
<Card>
  <CardContent className='p-4'>
    <div className='flex items-center justify-between mb-2'>
      <h3 className='font-bold'>Profile Completion</h3>
      <span className='text-sm text-gray-600'>{completionPercent}%</span>
    </div>
    <Progress value={completionPercent} />
    <div className='mt-3 space-y-2 text-sm'>
      {!user.image && (
        <div className='flex items-center gap-2 text-gray-600'>
          <Circle className='w-4 h-4' />
          <span>Add profile picture</span>
        </div>
      )}
      {!user.phone && (
        <div className='flex items-center gap-2 text-gray-600'>
          <Circle className='w-4 h-4' />
          <span>Add phone number</span>
        </div>
      )}
      {!user.address && (
        <div className='flex items-center gap-2 text-gray-600'>
          <Circle className='w-4 h-4' />
          <span>Add delivery address</span>
        </div>
      )}
    </div>
  </CardContent>
</Card>
```

---

## 📊 Implementation Roadmap

### **Phase 1: Essential Security (Week 1-2)**
1. ✅ Password change functionality
2. ✅ Email change with verification
3. ✅ Phone number management
4. ✅ Account deletion

### **Phase 2: Advanced Security (Week 3-4)**
5. ✅ Two-Factor Authentication
6. ✅ Active sessions management
7. ✅ Login history/activity log

### **Phase 3: User Preferences (Week 5-6)**
8. ✅ Notification preferences
9. ✅ Language & region settings
10. ✅ Privacy settings

### **Phase 4: UX Enhancements (Week 7-8)**
11. ✅ Quick stats dashboard
12. ✅ Recent activity widget
13. ✅ Profile completion indicator
14. ✅ Inline editing
15. ✅ Settings navigation tabs

---

## 🗂️ Recommended File Structure

```
app/[locale]/(root)/account/
├── page.tsx                          # Overview (Enhanced with stats)
├── layout.tsx                        # Account layout
├── orders/
│   └── page.tsx                      # Orders list
├── addresses/
│   └── page.tsx                      # Address management
└── manage/                           # Settings section
    ├── layout.tsx                    # Settings layout with sidebar
    ├── page.tsx                      # Profile settings
    ├── name/
    │   └── page.tsx                  # Name edit
    ├── email/
    │   └── page.tsx                  # Email change (NEW)
    ├── phone/
    │   └── page.tsx                  # Phone management (NEW)
    ├── password/
    │   └── page.tsx                  # Password change (NEW)
    ├── security/
    │   ├── page.tsx                  # Security overview (NEW)
    │   ├── 2fa/
    │   │   └── page.tsx              # 2FA setup (NEW)
    │   ├── sessions/
    │   │   └── page.tsx              # Active sessions (NEW)
    │   └── activity/
    │       └── page.tsx              # Login history (NEW)
    ├── notifications/
    │   └── page.tsx                  # Notification prefs (NEW)
    ├── privacy/
    │   └── page.tsx                  # Privacy settings (NEW)
    ├── preferences/
    │   └── page.tsx                  # Lang/region (NEW)
    └── delete/
        └── page.tsx                  # Account deletion (NEW)
```

---

## 🎨 Design Consistency Guidelines

### **Card Headers:**
```tsx
<h3 className='font-bold mb-2'>Section Title</h3>
```

### **Action Buttons:**
```tsx
<Button variant='outline' className='rounded-full w-32'>
  Edit
</Button>
```

### **Badges:**
```tsx
<Badge variant='outline' className='bg-green-50 text-green-700 border-green-300'>
  ✓ Status
</Badge>
```

### **Form Layouts:**
```tsx
<div className='space-y-6'>
  <FormField />
  <Button size='lg' className='w-full'>Submit</Button>
</div>
```

---

## 🔐 Security Best Practices

1. **Password Changes:**
   - Require current password
   - Enforce password strength
   - Send email notification
   - Optional: Logout other sessions

2. **Email Changes:**
   - Verify new email with code
   - Send notification to old email
   - Keep old email for 30 days (recovery)

3. **2FA:**
   - Generate backup codes
   - Allow recovery via email
   - Store backup codes hashed

4. **Session Management:**
   - Store session metadata
   - Auto-expire old sessions
   - Detect suspicious activity

5. **Account Deletion:**
   - Soft delete (mark as deleted)
   - Keep data for 30 days
   - Allow reactivation
   - Permanently delete after 30 days

---

## 📈 Success Metrics

### **User Engagement:**
- % of users with complete profiles
- % of users with 2FA enabled
- Avg. time to complete profile
- Settings page visits

### **Security:**
- Failed login attempts
- Password reset requests
- 2FA adoption rate
- Suspicious activity detections

### **User Satisfaction:**
- Support tickets for account issues
- User feedback on settings
- Feature usage analytics

---

## 🚀 Quick Wins (Can Implement Now)

### **1. Remove Placeholder Text** (5 minutes)
```tsx
// REMOVE these from settings page:
- "Coming soon" badges
- Disabled buttons with "View History"

// Either implement or hide the features
```

### **2. Add Phone Field Edit** (30 minutes)
```tsx
// Just add Edit button to phone section
// Create simple form similar to name edit
```

### **3. Better Breadcrumbs** (15 minutes)
```tsx
// Make breadcrumbs consistent across all pages
<Breadcrumbs>
  <BreadcrumbItem href='/account'>Account</BreadcrumbItem>
  <BreadcrumbItem href='/account/manage'>Settings</BreadcrumbItem>
  <BreadcrumbItem>Current Page</BreadcrumbItem>
</Breadcrumbs>
```

### **4. Add Last Login Display** (10 minutes)
```tsx
// Add to Overview page
<div className='text-sm text-gray-600'>
  Last login: {formatDate(session.user.lastLoginAt)}
</div>
```

---

## 💡 Summary

### **Current State:**
- ✅ Basic profile display
- ✅ Name editing
- ✅ Profile picture upload
- ✅ Email display
- ❌ Many features marked as "Coming Soon"
- ❌ No password management
- ❌ No email management
- ❌ No security features
- ❌ No user preferences

### **Recommended Priority:**
1. **Password change** - Critical for security
2. **Email change** - Important for account recovery
3. **2FA** - Modern security standard
4. **Session management** - Security best practice
5. **Notification preferences** - User control
6. **Enhanced overview** - Better user experience

### **Expected Impact:**
- 🔒 **Improved Security** - Password changes, 2FA, session management
- 😊 **Better UX** - Complete profile management in one place
- 📊 **More Engagement** - Stats and activity feed
- ⚙️ **User Control** - Preferences and privacy settings
- 🎯 **Professional Feel** - No "Coming Soon" placeholders

---

**Let me know which features you'd like to prioritize and implement first!** 🚀

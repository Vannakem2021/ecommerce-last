# Account Settings Page - Expansion Recommendations

## Current State

**Existing Settings:**
- ✅ Name (inline edit)
- ✅ Email (verified, read-only)
- ✅ Password (change/set)

**Total:** 3 settings

---

## Common E-Commerce Settings Features

### **Priority 1: Essential Features** ⭐⭐⭐

#### **1. Profile Picture / Avatar**
**What:** Upload and manage profile picture

**Why needed:**
- Personal touch and brand recognition
- Better user experience
- Common in all modern platforms

**Implementation:**
```typescript
// User card with avatar
<Card>
  <CardContent className="p-4">
    <div className="flex items-center gap-4">
      <Avatar className="w-16 h-16">
        <AvatarImage src={user.image} />
        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium">Profile Picture</p>
        <p className="text-sm text-muted-foreground">
          {user.image ? 'Click to change' : 'Add a photo'}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => setAvatarDialogOpen(true)}>
        {user.image ? 'Change' : 'Upload'}
      </Button>
    </div>
  </CardContent>
</Card>
```

**Effort:** Low (2-3 hours)
- Already have UploadThing set up
- User model already has `image` field
- Just need Dialog with upload UI

---

#### **2. Communication Preferences / Notifications**
**What:** Control email notifications and communication preferences

**Why needed:**
- Legal requirement (GDPR, privacy laws)
- Reduce unsubscribe rate
- User control over what they receive
- You already have notification system in place!

**Categories:**
```typescript
interface NotificationPreferences {
  email: {
    orderUpdates: boolean      // Order placed, shipped, delivered
    promotions: boolean         // Sales, deals, new products
    newsletter: boolean         // Weekly/monthly newsletter
    reviewReminders: boolean    // Ask for review after delivery
    stockAlerts: boolean        // Wishlist items back in stock
  }
  inApp: {
    orderUpdates: boolean
    promotions: boolean
    newProducts: boolean
  }
}
```

**UI Example:**
```
Notification Preferences
├─ Order Updates        [✓] Email  [✓] In-app
├─ Promotions & Deals   [ ] Email  [✓] In-app
├─ Newsletter           [ ] Email  [ ] In-app
├─ Review Reminders     [✓] Email  [ ] In-app
└─ Stock Alerts         [✓] Email  [✓] In-app
```

**Effort:** Medium (4-6 hours)
- Add `preferences` field to User model
- Create preferences Dialog
- Connect to existing notification system

---

#### **3. Language Preference**
**What:** Choose preferred language for the interface

**Why needed:**
- You already support multiple languages (en-US, kh)
- Currently uses browser/URL detection
- Let users override default

**Implementation:**
```typescript
// Simple select in dialog
<Card>
  <CardContent className="p-4 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">Language</p>
      <p className="text-sm text-muted-foreground">
        {currentLanguage === 'en-US' ? 'English (US)' : 'ខ្មែរ (Khmer)'}
      </p>
    </div>
    <Button variant="ghost" size="sm">Change</Button>
  </CardContent>
</Card>
```

**Effort:** Low (1-2 hours)
- Language infrastructure already exists
- Just need user preference storage
- Update middleware to check user preference first

---

#### **4. Currency Preference**
**What:** Choose preferred currency (USD or KHR)

**Why needed:**
- You already support both USD and Khmer Riel
- Currently site-wide setting
- Let users choose their preference

**Implementation:**
```typescript
<Card>
  <CardContent className="p-4 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">Currency</p>
      <p className="text-sm text-muted-foreground">
        {currency === 'USD' ? 'US Dollar ($)' : 'Khmer Riel (៛)'}
      </p>
    </div>
    <Button variant="ghost" size="sm">Change</Button>
  </CardContent>
</Card>
```

**Effort:** Low (1-2 hours)
- Currency system already exists
- Store user preference
- Override global setting

---

### **Priority 2: Nice to Have** ⭐⭐

#### **5. Phone Number**
**What:** Add/edit phone number

**Why needed:**
- Order notifications via SMS
- Account recovery
- Customer service contact

**Implementation:**
```typescript
<Card>
  <CardContent className="p-4 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium">Phone Number</p>
      <p className="text-sm text-muted-foreground">
        {user.phone || 'Not set'}
      </p>
    </div>
    <Button variant="ghost" size="sm">{user.phone ? 'Edit' : 'Add'}</Button>
  </CardContent>
</Card>
```

**Effort:** Low (1-2 hours)
- Add `phone` field to User model
- Simple form validation
- Inline edit dialog

---

#### **6. Saved Payment Methods**
**What:** Manage saved credit/debit cards or payment accounts

**Why needed:**
- Faster checkout
- Common in e-commerce
- Secure payment experience

**Implementation:**
```
Payment Methods
├─ Visa •••• 1234       Expires 12/25  [✓ Default] [Remove]
├─ Mastercard •••• 5678 Expires 03/26  [Set Default] [Remove]
└─ [+ Add Payment Method]
```

**Effort:** High (8-12 hours)
- Requires payment gateway integration
- PCI compliance considerations
- Tokenization for security

**Note:** Consider using payment gateway's saved cards feature (Stripe, PayPal) instead of storing yourself.

---

#### **7. Order Preferences**
**What:** Default shipping preferences and order settings

**Why needed:**
- Faster checkout
- Better UX for repeat customers

**Options:**
```typescript
interface OrderPreferences {
  defaultDeliveryMethod: string     // Standard, Express
  leavAtDoor: boolean               // Delivery instructions
  signatureRequired: boolean
  packageNotifications: boolean     // SMS when delivered
}
```

**Effort:** Medium (3-4 hours)

---

#### **8. Privacy Settings**
**What:** Control data usage and visibility

**Why needed:**
- Legal compliance (GDPR, CCPA)
- Build trust with users
- Modern privacy expectations

**Options:**
```
Privacy & Data
├─ Show order history to customer service  [✓]
├─ Allow personalized recommendations      [✓]
├─ Share data with partners                [ ]
└─ [Download My Data] [Delete Account]
```

**Effort:** Medium (4-6 hours)
- Data export functionality
- Account deletion flow
- Legal compliance

---

### **Priority 3: Advanced Features** ⭐

#### **9. Two-Factor Authentication (2FA)**
**What:** Add extra security layer

**Why needed:**
- Account security
- Prevent unauthorized access
- Industry standard

**Options:**
- SMS codes
- Authenticator app (Google Authenticator, Authy)
- Email codes

**Effort:** High (12-16 hours)
- SMS provider integration
- TOTP implementation
- Backup codes generation
- Recovery flow

---

#### **10. Connected Accounts / Social Login Management**
**What:** Manage linked social accounts (Google, Facebook, etc.)

**Why needed:**
- You already have Google OAuth
- Let users add/remove linked accounts
- See login methods

**Implementation:**
```
Connected Accounts
├─ Google     [✓ Connected]  user@gmail.com      [Disconnect]
├─ Facebook   [ ] Not connected                   [Connect]
└─ Apple      [ ] Not connected                   [Connect]
```

**Effort:** Medium (4-6 hours)
- Show currently linked accounts
- Add disconnect functionality
- Link additional accounts

---

#### **11. Session Management / Active Sessions**
**What:** View and manage active login sessions

**Why needed:**
- Security awareness
- Remote logout capability
- See where you're logged in

**Implementation:**
```
Active Sessions
├─ Chrome on Windows    Current session          Los Angeles
├─ Safari on iPhone     Last active 2 hours ago  Los Angeles
└─ Chrome on Mac        Last active 3 days ago   [Log out]
```

**Effort:** High (8-12 hours)
- Track sessions in database
- Store device info, location
- Remote logout capability

---

#### **12. Billing Address**
**What:** Separate billing address from shipping

**Why needed:**
- Business customers (different billing/shipping)
- Credit card billing verification

**Effort:** Medium (3-4 hours)
- You already have addresses system
- Add `billingAddress` field
- Checkbox "Same as shipping"

---

#### **13. Marketing Preferences**
**What:** Granular control over marketing communications

**Why needed:**
- Legal compliance
- Better targeting
- Reduce spam complaints

**Options:**
```
Marketing Preferences
├─ Email Marketing         [ ]
├─ SMS Marketing           [ ]  
├─ Push Notifications      [✓]
├─ Personalized Ads        [ ]
└─ Third-party Sharing     [ ]
```

**Effort:** Low (2-3 hours)
- Store preferences in User model
- Connect to email/SMS providers

---

#### **14. Accessibility Settings**
**What:** Customize display for accessibility needs

**Options:**
```typescript
interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large'
  highContrast: boolean
  reduceMotion: boolean
  screenReaderMode: boolean
}
```

**Effort:** High (16-20 hours)
- CSS variable system
- Component updates
- Testing across site

---

#### **15. Default Shipping Address**
**What:** Set default address for quick checkout

**Why needed:**
- Faster checkout
- Better UX for repeat customers

**Note:** You already have this implemented in the addresses page!

**Status:** ✅ Already done

---

## Recommended Implementation Order

### **Phase 1: Essential Profile Features** (6-8 hours)
1. ✅ Profile Picture / Avatar
2. ✅ Phone Number
3. ✅ Language Preference
4. ✅ Currency Preference

**Why first:**
- Quick wins, high impact
- Low complexity
- Complete basic profile

---

### **Phase 2: Communication & Preferences** (8-10 hours)
5. ✅ Notification Preferences (Email + In-app)
6. ✅ Marketing Preferences
7. ✅ Order Preferences

**Why second:**
- Legal compliance
- User control
- Reduce support tickets

---

### **Phase 3: Security & Privacy** (12-16 hours)
8. ✅ Connected Accounts Management
9. ✅ Privacy Settings (Data export, Delete account)
10. ✅ Two-Factor Authentication (Optional but recommended)

**Why third:**
- Security is important
- Privacy law compliance
- Trust building

---

### **Phase 4: Advanced Features** (Optional)
11. ✅ Session Management
12. ✅ Billing Address
13. ✅ Saved Payment Methods
14. ✅ Accessibility Settings

**Why last:**
- Nice to have, not essential
- Higher complexity
- Can be added gradually

---

## Detailed UI Structure (Recommended)

### **Option A: Categorized Tabs** (If many settings)

```
Settings Page
├─ Profile Tab
│   ├─ Avatar
│   ├─ Name
│   ├─ Email
│   └─ Phone
├─ Security Tab
│   ├─ Password
│   ├─ Two-Factor Auth
│   └─ Connected Accounts
├─ Preferences Tab
│   ├─ Language
│   ├─ Currency
│   └─ Notifications
└─ Privacy Tab
    ├─ Data Usage
    └─ Account Actions
```

**When to use:** 8+ settings

---

### **Option B: Single Page with Sections** (Current approach, recommended for now)

```
Settings
├─ Profile Picture
├─ Name
├─ Email
├─ Phone
├─ Language
├─ Currency
├─ Password
├─ Notification Preferences
└─ Privacy & Data
```

**When to use:** <10 settings (your current situation)

**Advantages:**
- All settings visible at once
- No tab switching
- Faster to scan
- Consistent with addresses page

---

## Implementation Priorities for YOU

Based on your current e-commerce app, I recommend:

### **Must Have** (Do first):
1. **Profile Picture** - Personal touch
2. **Phone Number** - Customer service needs
3. **Notification Preferences** - Legal + UX
4. **Language Preference** - You already support multiple languages

### **Should Have** (Do soon):
5. **Currency Preference** - You already support multiple currencies
6. **Order Preferences** - Improve checkout UX
7. **Privacy Settings** - Legal compliance, trust

### **Nice to Have** (Do later):
8. **Connected Accounts** - Since you have OAuth
9. **Two-Factor Auth** - Security for concerned users
10. **Session Management** - Advanced security

### **Skip for now:**
- Saved Payment Methods (high complexity, low immediate value)
- Accessibility Settings (major undertaking)
- Billing Address (unless B2B customers request it)

---

## Recommended Next Steps

### **Immediate (This sprint):**
1. ✅ Add Profile Picture
2. ✅ Add Phone Number
3. ✅ Add Language Preference
4. ✅ Add Currency Preference

**Time estimate:** 6-8 hours
**Impact:** High
**Complexity:** Low

---

### **Short-term (Next sprint):**
5. ✅ Notification Preferences
6. ✅ Marketing Preferences

**Time estimate:** 6-8 hours
**Impact:** High (legal compliance)
**Complexity:** Medium

---

### **Medium-term (Future sprint):**
7. ✅ Connected Accounts Management
8. ✅ Privacy Settings (Download data, Delete account)

**Time estimate:** 10-12 hours
**Impact:** Medium
**Complexity:** Medium-High

---

## Database Schema Updates Needed

### **User Model Extensions:**

```typescript
{
  // ... existing fields ...
  
  // New fields for Phase 1
  phone: String,
  preferredLanguage: String,  // 'en-US' | 'kh'
  preferredCurrency: String,  // 'USD' | 'KHR'
  
  // New fields for Phase 2
  preferences: {
    notifications: {
      email: {
        orderUpdates: Boolean (default: true),
        promotions: Boolean (default: true),
        newsletter: Boolean (default: false),
        reviewReminders: Boolean (default: true),
        stockAlerts: Boolean (default: true),
      },
      inApp: {
        orderUpdates: Boolean (default: true),
        promotions: Boolean (default: false),
        newProducts: Boolean (default: false),
      }
    },
    orders: {
      defaultDeliveryMethod: String,
      leaveAtDoor: Boolean,
      signatureRequired: Boolean,
    }
  },
  
  // New fields for Phase 3
  twoFactorEnabled: Boolean,
  twoFactorSecret: String,
  backupCodes: [String],
  connectedAccounts: [{
    provider: String,  // 'google', 'facebook'
    providerId: String,
    email: String,
    connectedAt: Date,
  }],
  
  // Privacy
  dataUsageConsent: {
    personalization: Boolean,
    analytics: Boolean,
    marketing: Boolean,
    thirdParty: Boolean,
    consentedAt: Date,
  }
}
```

---

## Final Recommendations

### **Start with Phase 1** (Immediate value, low effort):
1. Profile Picture
2. Phone Number
3. Language Preference
4. Currency Preference

**Total time:** 6-8 hours
**Impact:** High
**User value:** Immediate

### **Then Phase 2** (Legal + UX):
1. Notification Preferences
2. Marketing Preferences

**Total time:** 6-8 hours
**Impact:** Legal compliance + better UX
**User value:** Control and trust

### **Consider Phase 3** (Security):
1. Connected Accounts
2. Privacy Settings

**Total time:** 10-12 hours
**Impact:** Trust and security
**User value:** Advanced users appreciate this

---

## Questions for You

1. **Which features are most important to your users?**
   - Have you received requests for any specific settings?

2. **Legal requirements?**
   - Do you need GDPR compliance?
   - Any specific privacy laws in your region?

3. **Timeline?**
   - When do you need these features?
   - Can we implement in phases?

4. **Resources?**
   - Do you have SMS provider for phone verification?
   - Email service for notification preferences?

---

Let me know which features you'd like to implement first, and I'll help you build them! 🚀

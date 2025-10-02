# Email OTP Verification - Implementation Task Breakdown

**Project:** Email verification using OTP (One-Time Password) during sign-up  
**Branch:** `email-otp`  
**Estimated Total Time:** 8-10 hours  
**Priority:** High  
**Status:** Planning Phase

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Database & Models](#phase-1-database--models)
4. [Phase 2: Server Actions & Business Logic](#phase-2-server-actions--business-logic)
5. [Phase 3: Email Template](#phase-3-email-template)
6. [Phase 4: UI Components](#phase-4-ui-components)
7. [Phase 5: Sign-Up Flow Integration](#phase-5-sign-up-flow-integration)
8. [Phase 6: Security & Rate Limiting](#phase-6-security--rate-limiting)
9. [Phase 7: User Account Management](#phase-7-user-account-management)
10. [Phase 8: Testing & Validation](#phase-8-testing--validation)
11. [Phase 9: Documentation](#phase-9-documentation)

---

## Overview

### Goals
- Implement OTP-based email verification during user registration
- Prevent unverified users from accessing protected features
- Provide seamless user experience with in-page OTP entry
- Ensure security with rate limiting and attempt tracking

### User Flow
```
Sign Up Form → Submit → User Created (unverified) → Generate OTP → 
Send Email → Show OTP Input → User Enters OTP → Verify → 
Email Verified ✓ → Auto Sign-In → Redirect
```

### Technical Approach
- 6-digit numeric OTP
- 10-minute expiration
- Bcrypt hashing for OTP storage
- Maximum 5 attempts per OTP
- 60-second resend cooldown
- Email sent via Resend API

---

## Prerequisites

### ✅ Checklist Before Starting
- [ ] Branch `email-otp` is checked out
- [ ] All dependencies are installed (`npm install`)
- [ ] MongoDB is running and accessible
- [ ] Resend API key is configured in `.env.local`
- [ ] Current password reset functionality is working (reference)
- [ ] Understanding of existing auth flow (`auth.ts`, `user.actions.ts`)

### Environment Variables
Add to `.env.local`:
```bash
# Already should exist
RESEND_API_KEY=your-resend-api-key
SENDER_EMAIL=noreply@yourdomain.com
SENDER_NAME=Your Store Name
```

---

## Phase 1: Database & Models
**Estimated Time:** 1 hour  
**Priority:** Critical (Foundation)

### Task 1.1: Create EmailVerificationOTP Model
**File:** `lib/db/models/email-verification-otp.model.ts`

**Objectives:**
- Create Mongoose schema for OTP storage
- Add proper indexing for performance
- Implement TTL (Time To Live) for auto-cleanup

**Schema Fields:**
```typescript
{
  userId: string (ref to User, indexed)
  otpHash: string (bcrypt hashed OTP)
  expiresAt: Date (TTL indexed)
  attempts: number (default: 0, max: 5)
  verified: boolean (default: false)
  createdAt: Date (auto)
  updatedAt: Date (auto)
}
```

**Acceptance Criteria:**
- [ ] Schema created with all required fields
- [ ] Index on `userId` for fast lookup
- [ ] Index on `expiresAt` with TTL of 0 (auto-delete expired)
- [ ] Model exported and importable
- [ ] Follows existing model patterns (similar to `password-reset-token.model.ts`)

**Reference Files:**
- `lib/db/models/password-reset-token.model.ts`
- `lib/db/models/user.model.ts`

**Code Template:**
```typescript
import { Document, Model, model, models, Schema } from "mongoose";

export interface IEmailVerificationOTP extends Document {
  _id: string;
  userId: string;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emailVerificationOTPSchema = new Schema<IEmailVerificationOTP>(
  {
    userId: { type: String, required: true, ref: "User" },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
emailVerificationOTPSchema.index({ userId: 1 });
emailVerificationOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailVerificationOTP = 
  (models.EmailVerificationOTP as Model<IEmailVerificationOTP>) || 
  model<IEmailVerificationOTP>("EmailVerificationOTP", emailVerificationOTPSchema);

export default EmailVerificationOTP;
```

---

### Task 1.2: Update User Model (Optional Enhancement)
**File:** `lib/db/models/user.model.ts`

**Objectives:**
- Add `emailVerifiedAt` field for tracking verification timestamp
- Keep existing `emailVerified` boolean for backward compatibility

**Changes:**
```typescript
// Add to user schema
emailVerifiedAt: { type: Date, default: null }
```

**Acceptance Criteria:**
- [ ] New field added to schema
- [ ] Existing `emailVerified` boolean remains
- [ ] No breaking changes to existing code
- [ ] Field is optional (nullable)

**Note:** The existing `emailVerified: boolean` field is already present in the User model. We just need to use it.

---

## Phase 2: Server Actions & Business Logic
**Estimated Time:** 2-3 hours  
**Priority:** Critical

### Task 2.1: Create Email Verification Actions File
**File:** `lib/actions/email-verification.actions.ts`

**Objectives:**
- Create server actions for OTP generation, verification, and resend
- Implement security checks and rate limiting
- Handle all edge cases

---

#### Sub-task 2.1.1: Implement `generateEmailOTP()`

**Function Signature:**
```typescript
export async function generateEmailOTP(userId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}>
```

**Logic Flow:**
1. Validate userId
2. Check if user exists
3. Check if already verified (return success if true)
4. Check rate limit (max 5 OTPs per hour)
5. Delete any existing OTPs for this user
6. Generate 6-digit random OTP (100000-999999)
7. Hash OTP with bcrypt (4 rounds for speed)
8. Create OTP record with 10-minute expiration
9. Send email with OTP
10. Return success response

**Acceptance Criteria:**
- [ ] Generates 6-digit numeric OTP
- [ ] Hashes OTP before storage (bcrypt, 4 rounds)
- [ ] Sets 10-minute expiration
- [ ] Deletes old OTPs for same user
- [ ] Rate limits to 5 OTPs per hour per user
- [ ] Sends email via `sendEmailVerificationOTP()`
- [ ] Returns consistent success message (security)
- [ ] Handles all errors gracefully

**Security Considerations:**
- Don't reveal if user exists or not in error messages
- Rate limit by userId
- Use cryptographically secure random numbers

---

#### Sub-task 2.1.2: Implement `verifyEmailOTP()`

**Function Signature:**
```typescript
export async function verifyEmailOTP(userId: string, otp: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}>
```

**Logic Flow:**
1. Validate userId and OTP format (6 digits)
2. Find active OTP record (not expired, not used)
3. Check if max attempts exceeded (5 attempts)
4. Increment attempts counter
5. Compare OTP hash using bcrypt.compare()
6. If match:
   - Mark OTP as verified
   - Update user.emailVerified = true
   - Update user.emailVerifiedAt = now
   - Delete OTP record (optional)
   - Return success
7. If no match:
   - Return error with remaining attempts
8. If max attempts exceeded:
   - Delete OTP record
   - Return error asking to request new OTP

**Acceptance Criteria:**
- [ ] Validates OTP format (6 digits)
- [ ] Checks expiration
- [ ] Limits to 5 attempts
- [ ] Uses bcrypt.compare() for verification
- [ ] Updates user.emailVerified on success
- [ ] Deletes or marks OTP as used
- [ ] Returns clear error messages
- [ ] Prevents timing attacks (consistent response time)

**Security Considerations:**
- Constant-time comparison (bcrypt handles this)
- Clear error messages for UX but don't leak sensitive info
- Lock out after max attempts

---

#### Sub-task 2.1.3: Implement `resendEmailOTP()`

**Function Signature:**
```typescript
export async function resendEmailOTP(userId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  cooldownRemaining?: number;
}>
```

**Logic Flow:**
1. Validate userId
2. Check if user exists
3. Check if already verified
4. Find last OTP creation time
5. Enforce 60-second cooldown
6. If cooldown active, return remaining seconds
7. If cooldown passed, call `generateEmailOTP()`
8. Return result

**Acceptance Criteria:**
- [ ] Enforces 60-second cooldown
- [ ] Returns remaining cooldown time if too soon
- [ ] Reuses `generateEmailOTP()` logic
- [ ] Rate limits (max 5 per hour total)
- [ ] Returns clear user-friendly messages

---

#### Sub-task 2.1.4: Implement `checkEmailVerificationStatus()`

**Function Signature:**
```typescript
export async function checkEmailVerificationStatus(userId: string): Promise<{
  verified: boolean;
  hasActiveOTP: boolean;
  attemptsRemaining?: number;
  expiresIn?: number;
}>
```

**Logic Flow:**
1. Check user.emailVerified
2. If verified, return status
3. If not, check for active OTP
4. Return attempts remaining and expiration time

**Acceptance Criteria:**
- [ ] Returns current verification status
- [ ] Provides UX information (attempts, expiration)
- [ ] Fast query (indexed lookup)
- [ ] Used by frontend to show appropriate UI

---

### Task 2.2: Update User Registration Action
**File:** `lib/actions/user.actions.ts`

**Objectives:**
- Modify `registerUser()` to NOT auto-sign-in
- Generate OTP after successful registration
- Return userId for OTP verification flow

**Changes to `registerUser()`:**
```typescript
// After user creation:
const newUser = await User.create({
  name: user.name,
  email: user.email,
  password: await bcrypt.hash(user.password, 12),
  role: "user",
  emailVerified: false, // Keep as false
});

// Generate and send OTP
const otpResult = await generateEmailOTP(newUser._id.toString());

if (!otpResult.success) {
  console.error('Failed to send verification OTP:', otpResult.error);
  // Don't fail registration, but log error
}

return {
  success: true,
  message: "Account created. Please verify your email.",
  userId: newUser._id.toString(), // Return userId for OTP flow
  requiresVerification: true,
};
```

**Acceptance Criteria:**
- [ ] Creates user with `emailVerified: false`
- [ ] Generates OTP after user creation
- [ ] Returns userId in response
- [ ] Returns `requiresVerification: true` flag
- [ ] Doesn't auto-sign-in the user
- [ ] Handles OTP generation failure gracefully (logs but doesn't block)
- [ ] Backward compatible with tests

**Note:** Remove the auto-signin calls:
```typescript
// REMOVE THESE:
await signInWithCredentials({
  email: data.email,
  password: data.password,
});
redirect(callbackUrl);
```

---

## Phase 3: Email Template
**Estimated Time:** 1 hour  
**Priority:** High

### Task 3.1: Create OTP Email Component
**File:** `emails/email-verification-otp.tsx`

**Objectives:**
- Create professional React Email template
- Display 6-digit OTP prominently
- Include expiration warning
- Add help text and support links

**Template Content:**
```tsx
import {
  Body, Button, Container, Head, Heading, Html,
  Img, Link, Preview, Section, Tailwind, Text,
} from '@react-email/components'

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

type EmailVerificationOTPProps = {
  otp: string
  userEmail: string
  userName?: string
  siteName?: string
  siteLogo?: string
  expiresInMinutes?: number
}

export default function EmailVerificationOTP({
  otp,
  userEmail,
  userName = 'there',
  siteName = 'BCS',
  siteLogo = '/icons/logo.svg',
  expiresInMinutes = 10,
}: EmailVerificationOTPProps) {
  return (
    <Html>
      <Head />
      <Preview>Your verification code is {otp}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            {/* Logo */}
            <Section className="mt-[32px]">
              <Img
                src={siteLogo.startsWith('http') ? siteLogo : `${SERVER_URL}${siteLogo}`}
                width="40"
                height="37"
                alt={siteName}
                className="my-0 mx-auto"
              />
            </Section>
            
            {/* Heading */}
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Verify Your Email Address
            </Heading>
            
            {/* Greeting */}
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {userName},
            </Text>
            
            {/* Instructions */}
            <Text className="text-black text-[14px] leading-[24px]">
              Thank you for signing up for {siteName}! To complete your registration, 
              please enter the verification code below:
            </Text>
            
            {/* OTP Display - Large and Prominent */}
            <Section className="text-center my-[32px]">
              <div className="bg-[#f4f4f4] rounded-lg py-4 px-6 inline-block">
                <Text className="text-[32px] font-bold tracking-[0.5em] m-0 text-black">
                  {otp}
                </Text>
              </div>
            </Section>
            
            {/* Expiration Warning */}
            <Text className="text-black text-[14px] leading-[24px] text-center">
              ⏱️ This code expires in <strong>{expiresInMinutes} minutes</strong>
            </Text>
            
            {/* Security Notice */}
            <Section className="bg-[#fff9e6] border border-[#ffe066] rounded p-4 my-[24px]">
              <Text className="text-[12px] leading-[20px] m-0 text-[#666]">
                🔒 <strong>Security Tip:</strong> Never share this code with anyone. 
                {siteName} will never ask for your verification code.
              </Text>
            </Section>
            
            {/* Didn't Request */}
            <Text className="text-black text-[14px] leading-[24px]">
              If you didn't create an account with {siteName}, you can safely ignore 
              this email.
            </Text>
            
            {/* Help Text */}
            <Text className="text-[#666] text-[12px] leading-[20px] mt-[32px]">
              Need help? Contact us at{' '}
              <Link href={`mailto:support@${siteName.toLowerCase()}.com`} className="text-blue-600">
                support@{siteName.toLowerCase()}.com
              </Link>
            </Text>
            
            {/* Signature */}
            <Text className="text-black text-[14px] leading-[24px]">
              Best regards,<br />
              The {siteName} Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
```

**Acceptance Criteria:**
- [ ] OTP displayed prominently (large, bold)
- [ ] Expiration time clearly stated
- [ ] Professional design matching existing emails
- [ ] Mobile-responsive
- [ ] Security notice included
- [ ] Help/support contact provided
- [ ] Follows existing email template patterns

---

### Task 3.2: Add Email Sender Function
**File:** `emails/index.tsx`

**Objectives:**
- Add function to send OTP verification email
- Integrate with Resend API
- Handle errors gracefully

**Add Function:**
```typescript
export const sendEmailVerificationOTP = async ({
  otp,
  userEmail,
  userName,
}: {
  otp: string
  userEmail: string
  userName?: string
}) => {
  if (!resend) {
    console.error('❌ ERROR: Email service not configured - cannot send verification OTP')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { site } = await getSetting()

    const { data, error } = await resend.emails.send({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [userEmail],
      subject: `Verify your email - ${site.name}`,
      react: <EmailVerificationOTP
        otp={otp}
        userEmail={userEmail}
        userName={userName}
        siteName={site.name}
        siteLogo={site.logo}
        expiresInMinutes={10}
      />,
    })

    if (error) {
      console.error('Error sending verification OTP email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending verification OTP email:', error)
    return { success: false, error }
  }
}
```

**Acceptance Criteria:**
- [ ] Sends email via Resend
- [ ] Uses correct FROM address
- [ ] Includes site branding
- [ ] Handles errors gracefully
- [ ] Returns consistent response format
- [ ] Logs errors for debugging

---

## Phase 4: UI Components
**Estimated Time:** 2-3 hours  
**Priority:** High

### Task 4.1: Create OTP Input Component
**File:** `components/auth/otp-input.tsx`

**Objectives:**
- Create 6-box OTP input component
- Handle auto-focus and auto-advance
- Support paste functionality
- Keyboard navigation

**Component Features:**
- 6 individual input boxes
- Auto-focus on mount
- Auto-advance to next box on digit entry
- Auto-submit on 6th digit
- Backspace moves to previous box
- Paste support (splits 6-digit string)
- Clear button
- Visual feedback on error

**Component Props:**
```typescript
interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  error?: boolean
  disabled?: boolean
  autoFocus?: boolean
}
```

**Acceptance Criteria:**
- [ ] 6 individual input boxes
- [ ] Auto-focus on first box
- [ ] Auto-advance on digit entry
- [ ] Backspace moves to previous box
- [ ] Paste splits into boxes
- [ ] Calls onComplete when 6 digits entered
- [ ] Shows error state visually
- [ ] Accessible (ARIA labels)
- [ ] Mobile-friendly
- [ ] Matches design system

**Reference:**
- Look at existing form components in `components/ui/`
- Use Tailwind classes consistent with project

---

### Task 4.2: Create Verify Email Page
**File:** `app/[locale]/(auth)/verify-email/page.tsx`

**Objectives:**
- Create verification page shown after sign-up
- Display OTP input
- Handle verification logic
- Show countdown timer
- Resend functionality

**Page Layout:**
```
┌─────────────────────────────────┐
│        [Site Logo]              │
│                                 │
│    Verify Your Email Address   │
│                                 │
│  We sent a 6-digit code to:    │
│     user@example.com            │
│                                 │
│   ┌───┬───┬───┬───┬───┬───┐   │
│   │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │   │
│   └───┴───┴───┴───┴───┴───┘   │
│                                 │
│   Code expires in 09:45        │
│                                 │
│   [Verify Email Button]        │
│                                 │
│  Didn't receive code?          │
│  [Resend Code] (wait 60s)      │
└─────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Shows user's email address
- [ ] OTP input component integrated
- [ ] Countdown timer (10 minutes)
- [ ] Resend button with cooldown (60s)
- [ ] Loading states during verification
- [ ] Error messages display
- [ ] Success animation/message
- [ ] Auto-redirect on success (2 seconds)
- [ ] Responsive design
- [ ] Accessible

---

### Task 4.3: Create Verify Email Form Component
**File:** `app/[locale]/(auth)/verify-email/verify-email-form.tsx`

**Objectives:**
- Separate form logic from page
- Handle OTP submission
- Manage loading and error states
- Call verification action

**Component Logic:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verifyEmailOTP, resendEmailOTP } from '@/lib/actions/email-verification.actions'
import OTPInput from '@/components/auth/otp-input'
import { toast } from '@/hooks/use-toast'

interface VerifyEmailFormProps {
  userId: string
  userEmail: string
}

export default function VerifyEmailForm({ userId, userEmail }: VerifyEmailFormProps) {
  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [expiresAt, setExpiresAt] = useState(Date.now() + 10 * 60 * 1000)
  const router = useRouter()

  // Countdown timer for expiration
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        setError('Code expired. Please request a new one.')
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleVerify = async (otpValue: string) => {
    setIsVerifying(true)
    setError('')
    
    const result = await verifyEmailOTP(userId, otpValue)
    
    if (result.success) {
      toast({ title: 'Success', description: 'Email verified successfully!' })
      // Sign in and redirect
      // Implementation in next phase
    } else {
      setError(result.error || 'Invalid code')
      setOtp('') // Clear input
    }
    
    setIsVerifying(false)
  }

  const handleResend = async () => {
    const result = await resendEmailOTP(userId)
    
    if (result.success) {
      toast({ title: 'Code sent', description: 'Check your email for the new code' })
      setResendCooldown(60)
      setExpiresAt(Date.now() + 10 * 60 * 1000) // Reset expiration
    } else if (result.cooldownRemaining) {
      setResendCooldown(result.cooldownRemaining)
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    }
  }

  return (
    // Form JSX implementation
  )
}
```

**Acceptance Criteria:**
- [ ] Manages OTP state
- [ ] Handles verification with loading state
- [ ] Shows error messages
- [ ] Countdown timer displays correctly
- [ ] Resend with cooldown works
- [ ] Auto-submits on 6 digits
- [ ] Clears input on error
- [ ] Shows success and redirects
- [ ] Handles all edge cases

---

## Phase 5: Sign-Up Flow Integration
**Estimated Time:** 1-2 hours  
**Priority:** Critical

### Task 5.1: Update Sign-Up Form Component
**File:** `app/[locale]/(auth)/sign-up/signup-form.tsx`

**Objectives:**
- Modify onSubmit to handle new flow
- Redirect to verify-email page after registration
- Pass userId to verification page

**Changes to `onSubmit`:**
```typescript
const onSubmit = async (data: IUserSignUp) => {
  setIsLoading(true)
  try {
    const res = await registerUser(data)
    
    if (!res.success) {
      setIsLoading(false)
      toast({
        title: 'Error',
        description: res.error,
        variant: 'destructive',
      })
      return
    }

    // New flow: redirect to email verification
    if (res.requiresVerification && res.userId) {
      toast({
        title: 'Account Created',
        description: 'Please check your email to verify your account.',
      })
      
      // Redirect to verification page with userId
      router.push(`/verify-email?userId=${res.userId}&email=${encodeURIComponent(data.email)}`)
    } else {
      // Fallback for backward compatibility
      await signInWithCredentials({
        email: data.email,
        password: data.password,
      })
      redirect(callbackUrl)
    }
  } catch (error) {
    // Error handling
  } finally {
    setIsLoading(false)
  }
}
```

**Acceptance Criteria:**
- [ ] Redirects to verify-email page after registration
- [ ] Passes userId via URL params (secure)
- [ ] Shows appropriate toast messages
- [ ] Doesn't auto-sign-in anymore
- [ ] Handles errors gracefully
- [ ] Backward compatible with tests

---

### Task 5.2: Create Verify Email Page with Auth Check
**File:** `app/[locale]/(auth)/verify-email/page.tsx`

**Objectives:**
- Get userId from URL params
- Validate userId exists
- Check if already verified (redirect if yes)
- Render verification form

**Page Implementation:**
```typescript
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import VerifyEmailForm from './verify-email-form'
import { checkEmailVerificationStatus } from '@/lib/actions/email-verification.actions'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address',
}

interface VerifyEmailPageProps {
  searchParams: Promise<{
    userId?: string
    email?: string
  }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams
  const { userId, email } = params

  // Validate params
  if (!userId || !email) {
    redirect('/sign-up')
  }

  // Check verification status
  const status = await checkEmailVerificationStatus(userId)
  
  if (status.verified) {
    // Already verified, redirect to sign-in
    redirect('/sign-in?message=already-verified')
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyEmailForm userId={userId} userEmail={decodeURIComponent(email)} />
      </Suspense>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Validates URL parameters
- [ ] Checks if already verified
- [ ] Redirects appropriately
- [ ] Renders form with correct props
- [ ] Handles missing params gracefully
- [ ] Loading state shown

---

### Task 5.3: Handle Post-Verification Sign-In
**File:** `app/[locale]/(auth)/verify-email/verify-email-form.tsx`

**Objectives:**
- Sign in user automatically after verification
- Redirect to appropriate page based on role
- Handle callback URL if present

**Add to `handleVerify` success case:**
```typescript
if (result.success) {
  toast({ 
    title: 'Success', 
    description: 'Email verified! Signing you in...' 
  })
  
  // Auto sign-in after verification
  // Note: User's password is not available here
  // Options:
  // 1. Create a temporary sign-in token
  // 2. Use session-based verification
  // 3. Ask user to sign in manually
  
  // Recommended: Option 3 (most secure)
  setTimeout(() => {
    router.push('/sign-in?message=verified&email=' + encodeURIComponent(userEmail))
  }, 2000)
}
```

**Alternative: Create Verification Token for Auto Sign-In:**
```typescript
// After email verification:
// 1. Generate short-lived token (5 minutes)
// 2. Store in VerificationToken collection
// 3. Redirect to /sign-in/verify-token?token=xxx
// 4. Auto-sign-in with token
// 5. Delete token
```

**Acceptance Criteria:**
- [ ] User is signed in after verification (or redirected to sign-in)
- [ ] Success message shown
- [ ] Redirect happens after 2 seconds
- [ ] Callback URL preserved if present
- [ ] Secure implementation (no password exposure)

---

## Phase 6: Security & Rate Limiting
**Estimated Time:** 1-2 hours  
**Priority:** High

### Task 6.1: Implement Rate Limiting
**File:** `lib/rate-limit.ts` (create if doesn't exist)

**Objectives:**
- Create rate limiting utility
- Limit OTP generation (5 per hour per user)
- Limit verification attempts (per IP)
- Use Redis or in-memory store

**Implementation Options:**

**Option A: Simple In-Memory (Development)**
```typescript
// lib/rate-limit.ts
const otpGenerationMap = new Map<string, { count: number; resetAt: number }>()

export function checkOTPGenerationRateLimit(userId: string): {
  allowed: boolean
  remaining: number
  resetIn: number
} {
  const now = Date.now()
  const key = `otp-gen:${userId}`
  const record = otpGenerationMap.get(key)
  
  if (!record || now > record.resetAt) {
    // Reset window
    otpGenerationMap.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return { allowed: true, remaining: 4, resetIn: 3600 }
  }
  
  if (record.count >= 5) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: Math.ceil((record.resetAt - now) / 1000) 
    }
  }
  
  record.count++
  return { 
    allowed: true, 
    remaining: 5 - record.count, 
    resetIn: Math.ceil((record.resetAt - now) / 1000) 
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of otpGenerationMap.entries()) {
    if (now > record.resetAt) {
      otpGenerationMap.delete(key)
    }
  }
}, 5 * 60 * 1000) // Every 5 minutes
```

**Option B: MongoDB-Based (Production)**
```typescript
// Use a RateLimit model
const rateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  resetAt: { type: Date, required: true },
})

rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 })
```

**Acceptance Criteria:**
- [ ] Rate limit OTP generation (5/hour/user)
- [ ] Rate limit resend (60 seconds cooldown)
- [ ] Rate limit verification attempts (handled in model)
- [ ] Returns clear error messages
- [ ] Works in development and production
- [ ] Cleans up expired entries

---

### Task 6.2: Add Security Validations
**File:** `lib/actions/email-verification.actions.ts`

**Objectives:**
- Validate all inputs
- Prevent abuse
- Add logging for suspicious activity

**Validations to Add:**
```typescript
// In verifyEmailOTP:
// 1. Check if OTP is exactly 6 digits
if (!/^\d{6}$/.test(otp)) {
  return { success: false, error: 'Invalid code format' }
}

// 2. Check if userId is valid MongoDB ID
if (!isValidObjectId(userId)) {
  return { success: false, error: 'Invalid request' }
}

// 3. Log suspicious activity
if (otpRecord.attempts > 3) {
  console.warn(`High verification attempts for user ${userId}`)
}

// 4. Consider adding IP-based rate limiting
// (requires middleware access to req object)
```

**Acceptance Criteria:**
- [ ] All inputs validated
- [ ] Invalid formats rejected early
- [ ] Suspicious activity logged
- [ ] No sensitive data in logs
- [ ] Consistent error messages

---

## Phase 7: User Account Management
**Estimated Time:** 1 hour  
**Priority:** Medium

### Task 7.1: Add Resend Verification from Account Page
**File:** `app/[locale]/(root)/account/page.tsx` (or create verification settings page)

**Objectives:**
- Allow unverified users to resend verification email
- Show verification status badge
- Provide clear call-to-action

**UI Elements:**
```tsx
// Add to account page
{!user.emailVerified && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Email Not Verified</AlertTitle>
    <AlertDescription>
      Please verify your email address to access all features.
      <Button 
        variant="link" 
        onClick={handleResendVerification}
        disabled={resendCooldown > 0}
      >
        {resendCooldown > 0 
          ? `Resend in ${resendCooldown}s` 
          : 'Resend Verification Email'}
      </Button>
    </AlertDescription>
  </Alert>
)}
```

**Acceptance Criteria:**
- [ ] Shows verification status
- [ ] Resend button for unverified users
- [ ] Cooldown timer displayed
- [ ] Success/error messages
- [ ] Redirects to verification page

---

### Task 7.2: Protect Features for Unverified Users
**File:** `lib/auth-protection.ts` (create) or modify existing middleware

**Objectives:**
- Block checkout for unverified users
- Block order placement
- Show helpful messages
- Allow browsing and cart

**Protected Actions:**
```typescript
// In checkout page/action:
const session = await auth()
if (session?.user && !session.user.emailVerified) {
  return {
    success: false,
    error: 'Please verify your email before placing orders',
    redirectTo: '/verify-email'
  }
}
```

**Features to Protect:**
- [ ] Checkout process
- [ ] Order placement
- [ ] Payment processing
- [ ] Account settings changes (optional)

**Features to Allow:**
- [ ] Browsing products
- [ ] Adding to cart
- [ ] Viewing account (with verification prompt)
- [ ] Signing out

**Acceptance Criteria:**
- [ ] Unverified users blocked from checkout
- [ ] Clear error messages shown
- [ ] Redirect to verification page
- [ ] Browsing/cart still works
- [ ] No breaking changes to existing flow

---

## Phase 8: Testing & Validation
**Estimated Time:** 1-2 hours  
**Priority:** High

### Task 8.1: Manual Testing Checklist

**Happy Path:**
- [ ] Register new account
- [ ] Receive OTP email within 1 minute
- [ ] Enter correct OTP
- [ ] Email verified successfully
- [ ] Auto signed-in or redirected to sign-in
- [ ] Can access protected features

**Error Cases:**
- [ ] Enter wrong OTP (5 times)
- [ ] Max attempts message shown
- [ ] Wait for OTP to expire (10 min)
- [ ] Expired message shown
- [ ] Resend OTP before cooldown
- [ ] Cooldown message shown
- [ ] Resend after cooldown
- [ ] New OTP received

**Edge Cases:**
- [ ] Try to verify already verified email
- [ ] Access verify page without userId
- [ ] Access verify page with invalid userId
- [ ] Resend OTP 6 times in an hour
- [ ] Rate limit message shown
- [ ] Paste 6-digit OTP works
- [ ] Paste non-numeric text fails gracefully

**Security Tests:**
- [ ] OTP is hashed in database (not plain text)
- [ ] Old OTPs deleted on new generation
- [ ] Expired OTPs auto-deleted by MongoDB TTL
- [ ] Can't reuse verified OTP
- [ ] Rate limiting works
- [ ] No sensitive data in error messages

---

### Task 8.2: Create Unit Tests (Optional but Recommended)
**File:** `__tests__/email-verification.test.ts`

**Test Cases:**
```typescript
describe('Email Verification', () => {
  describe('generateEmailOTP', () => {
    it('should generate 6-digit OTP')
    it('should hash OTP before storage')
    it('should set 10-minute expiration')
    it('should delete old OTPs')
    it('should rate limit to 5 per hour')
    it('should send email')
  })

  describe('verifyEmailOTP', () => {
    it('should verify correct OTP')
    it('should reject incorrect OTP')
    it('should track attempts')
    it('should reject after 5 attempts')
    it('should reject expired OTP')
    it('should update user.emailVerified')
  })

  describe('resendEmailOTP', () => {
    it('should enforce 60s cooldown')
    it('should generate new OTP after cooldown')
    it('should respect hourly rate limit')
  })
})
```

**Acceptance Criteria:**
- [ ] All critical paths tested
- [ ] Tests pass consistently
- [ ] Mocks email sending
- [ ] Cleans up test data

---

## Phase 9: Documentation
**Estimated Time:** 30 minutes  
**Priority:** Medium

### Task 9.1: Create Email Verification Documentation
**File:** `docs/EMAIL-VERIFICATION.md`

**Content:**
- Overview of email verification flow
- Architecture diagram
- Security features
- Configuration guide
- Troubleshooting common issues
- API documentation for actions

**Acceptance Criteria:**
- [ ] Clear flow diagram
- [ ] All functions documented
- [ ] Configuration steps listed
- [ ] Common issues addressed

---

### Task 9.2: Update Environment Variables Documentation
**File:** `.env.example`

**Add Comments:**
```bash
# Email Verification Settings
# OTP expiration time in minutes (default: 10)
EMAIL_OTP_EXPIRATION=10

# Maximum OTP attempts before lockout (default: 5)
EMAIL_OTP_MAX_ATTEMPTS=5

# Resend cooldown in seconds (default: 60)
EMAIL_OTP_RESEND_COOLDOWN=60
```

**Acceptance Criteria:**
- [ ] All env vars documented
- [ ] Defaults specified
- [ ] Examples provided

---

### Task 9.3: Update Main README
**File:** `README.md`

**Add Section:**
```markdown
## Email Verification

This application requires email verification for new user registrations.

### User Flow
1. User signs up with email and password
2. Verification code sent to email
3. User enters 6-digit code
4. Email verified, user can sign in

### Configuration
See `.env.example` for email service configuration.

### Troubleshooting
- **Not receiving emails?** Check Resend API key configuration
- **Code expired?** Codes expire after 10 minutes, request a new one
- **Too many attempts?** Wait 1 hour before requesting new codes
```

**Acceptance Criteria:**
- [ ] User-facing documentation clear
- [ ] Developer setup documented
- [ ] Troubleshooting section added

---

## Timeline & Dependencies

```
Phase 1 (Models) → Phase 2 (Actions) → Phase 3 (Email)
                                           ↓
                       Phase 4 (UI) ← ─────┘
                           ↓
                    Phase 5 (Integration)
                           ↓
                    Phase 6 (Security)
                           ↓
                    Phase 7 (Account Mgmt)
                           ↓
                    Phase 8 (Testing)
                           ↓
                    Phase 9 (Documentation)
```

**Critical Path:** Phases 1-5 must be completed in order.  
**Parallel Work:** Phase 3 (Email) can be done alongside Phase 4 (UI).  
**Optional:** Phase 8.2 (unit tests) can be done last or skipped for MVP.

---

## Success Criteria

### MVP (Minimum Viable Product)
- [ ] User can sign up and receive OTP email
- [ ] User can verify email with OTP
- [ ] Unverified users can't checkout
- [ ] Resend functionality works
- [ ] Rate limiting prevents abuse

### Complete
- [ ] All edge cases handled
- [ ] Security measures in place
- [ ] User account management integrated
- [ ] Manual testing passed
- [ ] Documentation complete

### Production Ready
- [ ] Unit tests written
- [ ] Load testing completed
- [ ] Monitoring/logging set up
- [ ] Error tracking configured
- [ ] Email deliverability tested

---

## Risk Assessment

### High Risk
- **Email deliverability**: Resend API might have issues, emails might go to spam
  - *Mitigation*: Test thoroughly, add fallback instructions, verify SPF/DKIM
  
- **Rate limiting bypass**: Users might create multiple accounts
  - *Mitigation*: Add IP-based rate limiting, CAPTCHA on sign-up

### Medium Risk
- **User experience**: OTP flow adds friction to sign-up
  - *Mitigation*: Make UI as smooth as possible, clear instructions, resend easily accessible

- **Lost/expired codes**: Users might lose access
  - *Mitigation*: Easy resend, clear expiration warnings, support contact

### Low Risk
- **Database cleanup**: Expired OTPs might pile up
  - *Mitigation*: MongoDB TTL index handles automatic cleanup

---

## Rollback Plan

If email verification causes issues in production:

1. **Quick Disable** (environment variable):
   ```bash
   EMAIL_VERIFICATION_REQUIRED=false
   ```

2. **Code Rollback**:
   - Revert `registerUser()` to auto-sign-in
   - Hide verification UI
   - Allow unverified users to checkout

3. **Data Cleanup**:
   - No data migration needed
   - `emailVerified` field already exists
   - OTP records will auto-expire

---

## Notes

- This implementation follows existing patterns in the codebase (similar to password reset)
- Security is prioritized throughout
- User experience is kept smooth with auto-focus, paste support, clear messaging
- Rate limiting prevents abuse without blocking legitimate users
- Documentation ensures maintainability

---

## Questions for Product Owner

Before starting implementation, confirm:

1. Should email verification be **required** for all users, or just for checkout?
2. Should we verify OAuth sign-ups (Google) as well, or trust OAuth providers?
3. What should happen if user's email bounces? Allow retry or block account?
4. Should we send a welcome email after successful verification?
5. Do we need admin dashboard to view verification statistics?

---

**Last Updated:** 2025-10-01  
**Estimated Total Time:** 8-10 hours  
**Complexity:** Medium  
**Priority:** High

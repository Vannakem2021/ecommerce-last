# OAuth Account Linking Solutions

## Problem
Currently, when a user signs up with email/password and later tries to sign in with Google using the same email, they get this error:
```
[auth][error] OAuthAccountNotLinked: Another account already exists with the same e-mail address
```

This is not ideal UX - users expect to be able to sign in with any method if the email matches.

## Current Setup Analysis

✅ **What's Already Implemented:**
- SignIn callback handles existing users properly
- Preserves role and user data when OAuth user exists
- Updates last login timestamp
- Sends notifications for new Google sign-ups

❌ **What's Missing:**
- Automatic account linking is disabled by default (NextAuth security feature)
- No email verification for credentials sign-up
- No custom error handling for OAuthAccountNotLinked

---

## Solution Options

### Option 1: Enable Automatic Account Linking ⚡ (Recommended for Quick Fix)

**Pros:**
- ✅ Simple one-line configuration change
- ✅ Seamless user experience
- ✅ Your existing signIn callback already handles data merging
- ✅ Works immediately without additional code

**Cons:**
- ⚠️ Security risk: Account takeover if email isn't verified
- ⚠️ Called "dangerous" by NextAuth for a reason

**Security Risk:**
If User A signs up with `attacker@gmail.com` using email/password without verifying, then User B (the real Gmail owner) tries to sign in with Google OAuth, they'll get access to User A's account data.

**Implementation:**
```typescript
// In auth.ts
providers: [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: true, // ⚠️ Enable account linking
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        role: "user",
      };
    },
  }),
  // ... rest
]
```

**When to Use:**
- ✅ You trust your users
- ✅ Email verification is implemented (or will be soon)
- ✅ Quick fix needed for better UX

---

### Option 2: Email Verification + Automatic Linking 🔒 (Most Secure)

**Pros:**
- ✅ Secure account linking (only verified emails)
- ✅ Prevents account takeover attacks
- ✅ Industry best practice

**Cons:**
- ❌ Requires implementing email verification system
- ❌ More complex setup
- ❌ Extra step for users during sign-up

**Implementation Steps:**
1. Add email verification to credentials sign-up
2. Only allow account linking for verified emails
3. Store `emailVerified` timestamp in User model

**Code Changes Needed:**
```typescript
// 1. Update User model
interface IUser {
  // ... existing fields
  emailVerified: Date | null;
}

// 2. Custom signIn callback with verification check
signIn: async ({ user, account }) => {
  if (account?.provider === "google") {
    const existingUser = await User.findOne({ email: user.email });
    
    if (existingUser && !existingUser.emailVerified) {
      // Don't link - email not verified
      throw new Error("Please verify your email first");
    }
    
    // Safe to link - email is verified
    // ... rest of linking logic
  }
}

// 3. Send verification email on sign-up
// 4. Verify email token endpoint
// 5. Update User.emailVerified on verification
```

**When to Use:**
- ✅ Security is top priority
- ✅ You have time to implement email verification
- ✅ Building a production-grade auth system

---

### Option 3: Manual Account Linking Flow 🔗

**Pros:**
- ✅ User has full control
- ✅ Secure - requires authentication
- ✅ Clear audit trail

**Cons:**
- ❌ Most complex to implement
- ❌ Extra steps for users
- ❌ Requires account settings UI

**Flow:**
1. User signs up with email/password
2. Later tries Google sign-in → Gets error
3. Redirected to account settings
4. User manually links Google account (requires password confirmation)
5. Future Google sign-ins work seamlessly

**When to Use:**
- ✅ Maximum security needed
- ✅ Users need to manage multiple auth providers
- ✅ Building enterprise features

---

### Option 4: Better Error Handling (Minimum Viable)

**Pros:**
- ✅ Simple to implement
- ✅ Better UX than generic error
- ✅ No security risks

**Cons:**
- ❌ Doesn't solve the core problem
- ❌ Users still can't sign in with Google
- ❌ Requires remembering which method they used

**Implementation:**
```typescript
// In auth.ts
pages: {
  signIn: "/sign-in",
  error: "/sign-in", // Custom error handling
},

// In sign-in page
const error = searchParams.error;
if (error === "OAuthAccountNotLinked") {
  return (
    <Alert>
      <AlertTitle>Account Already Exists</AlertTitle>
      <AlertDescription>
        An account with this email already exists. 
        Please sign in with your email and password instead.
      </AlertDescription>
    </Alert>
  );
}
```

**When to Use:**
- ✅ Temporary solution
- ✅ Buying time to implement proper solution
- ✅ Need better UX immediately

---

## Recommended Approach

### Phase 1: Quick Fix (Today) ✅
**Enable automatic account linking** with a TODO to add email verification:

```typescript
Google({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  allowDangerousEmailAccountLinking: true,
  profile(profile) {
    return {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      image: profile.picture,
      role: "user",
    };
  },
}),
```

### Phase 2: Add Security (Next Sprint) 🔒
1. Implement email verification for credentials sign-up
2. Add `emailVerified` field to User model
3. Update signIn callback to check verification
4. Remove `allowDangerousEmailAccountLinking` once verification is live

### Phase 3: Advanced Features (Future) 🚀
1. Account settings page to view linked providers
2. Manual account linking/unlinking UI
3. "Sign in with..." suggestions based on email

---

## Security Considerations

### If Using `allowDangerousEmailAccountLinking: true`:

1. **Mitigations:**
   - ✅ Require strong passwords (you likely already have this)
   - ✅ Rate limiting on sign-up (prevent spam accounts)
   - ✅ Monitor for suspicious account linking patterns
   - ✅ Add email verification ASAP

2. **Risk Assessment:**
   - **Low Risk:** B2C e-commerce with no sensitive data
   - **Medium Risk:** Platform with user-generated content
   - **High Risk:** Financial/healthcare applications

3. **Acceptable Use Cases:**
   - ✅ E-commerce storefront (your case)
   - ✅ Blog/content platforms
   - ✅ Community forums
   - ❌ Banking apps
   - ❌ Healthcare portals
   - ❌ Admin/enterprise systems

---

## Implementation Checklist

### For Quick Fix (Option 1):
- [ ] Add `allowDangerousEmailAccountLinking: true` to Google provider
- [ ] Test: Sign up with email/password
- [ ] Test: Sign in with Google using same email (should work)
- [ ] Test: Verify role is preserved
- [ ] Test: Verify user data is preserved
- [ ] Add TODO comment for email verification
- [ ] Document the security trade-off

### For Secure Solution (Option 2):
- [ ] Add `emailVerified` field to User model
- [ ] Create email verification token system
- [ ] Send verification email on sign-up
- [ ] Create email verification endpoint
- [ ] Update signIn callback with verification check
- [ ] Add "Resend verification email" functionality
- [ ] Show verification status in account settings
- [ ] Only allow account linking for verified emails
- [ ] Test all flows thoroughly

---

## Code Example: Quick Fix

```typescript
// auth.ts - Updated providers array
providers: [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // TODO: Remove this once email verification is implemented
    // This allows users to sign in with Google even if they signed up with email/password
    // Security note: This could allow account takeover if email isn't verified
    // Risk is acceptable for e-commerce use case, but should add verification soon
    allowDangerousEmailAccountLinking: true,
    profile(profile) {
      return {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
        role: "user",
      };
    },
  }),
  CredentialsProvider({
    // ... existing credentials config
  }),
],
```

---

## Testing Scenarios

### Test Case 1: Existing Credentials User Signs In With Google
1. Sign up with email `test@example.com` and password
2. Sign out
3. Sign in with Google using `test@example.com`
4. ✅ Should sign in successfully
5. ✅ Should preserve original role
6. ✅ Should preserve user data

### Test Case 2: New Google User
1. Sign in with Google using `newuser@example.com`
2. ✅ Should create new account
3. ✅ Should have role "user"
4. ✅ Should send admin notification

### Test Case 3: Existing Google User Signs In Again
1. Already signed up with Google before
2. Sign in with Google again
3. ✅ Should sign in successfully
4. ✅ Should update lastLoginAt

---

## Recommended Decision

For your **e-commerce storefront**, I recommend:

**✅ Option 1 (Quick Fix) + Plan for Option 2**

**Reasoning:**
1. ✅ E-commerce has relatively low security risk (no financial data, payments via third-party)
2. ✅ Better UX is critical for conversion rates
3. ✅ Your existing signIn callback already handles data merging well
4. ✅ You can add email verification later without breaking existing users

**Action Items:**
1. **Now:** Enable `allowDangerousEmailAccountLinking: true`
2. **Next Sprint:** Implement email verification
3. **Later:** Build account linking UI in settings

Would you like me to implement Option 1 (quick fix) now?

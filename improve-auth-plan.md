# Authentication System Improvement Plan

## Current State Analysis

### Issues Identified

#### 1. User Registration Validation Problem
**Root Cause**: The current validation system has a mismatch between registration requirements and user schema validation.

**Current Flow**:
- `UserSignUpSchema` only requires: `name`, `email`, `password`, `confirmPassword`
- `registerUser()` function creates user with minimal data
- User model has conditional requirements for `paymentMethod` and `address` fields when `role === "user"`
- The validation in `UserInputSchema` (lines 326-359 in `lib/validator.ts`) requires complete address and payment method for users with role "user"

**Problem**: New users are created with role "user" by default, but the registration process doesn't collect the required address and payment method information, causing validation failures.

#### 2. Weak Password Validation
**Current State**: 
- Password minimum length: 3 characters (`lib/validator.ts` line 275)
- No complexity requirements
- Allows pure numbers, simple patterns

#### 3. Missing Password Reset Functionality
**Current State**: No password reset/forgot password functionality exists
- No routes for password reset
- No email templates for password reset
- No token-based reset mechanism

### Current Architecture Strengths
- Resend email integration already configured
- Role-based access control (RBAC) system in place
- Proper email normalization
- NextAuth.js integration with credentials and Google OAuth
- Conditional user schema validation based on roles

## Implementation Plan

### Phase 1: Fix User Registration Validation

#### 1.1 Modify User Registration Flow
**Approach**: Make address and payment method optional during registration, required only during checkout

**Changes Required**:
1. Update user model to make address/payment fields truly optional for new registrations
2. Modify validation to allow incomplete profiles for new users
3. Add profile completion flow for checkout process

#### 1.2 Database Schema Updates
**File**: `lib/db/models/user.model.ts`
- Remove conditional `required` functions for address fields during registration
- Add `profileComplete` boolean field to track completion status
- Keep conditional validation for checkout/order placement

#### 1.3 Validation Schema Updates
**File**: `lib/validator.ts`
- Create separate schemas for registration vs. profile completion
- Update `UserSignUpSchema` to remain minimal
- Create `UserProfileCompleteSchema` for checkout requirements

### Phase 2: Implement Password Reset Functionality

#### 2.1 Database Schema for Reset Tokens
**New Model**: Password reset token model
- `userId`: Reference to user
- `token`: Secure random token
- `expiresAt`: Token expiration timestamp
- `used`: Boolean flag for one-time use

#### 2.2 Password Reset Actions
**File**: `lib/actions/user.actions.ts`
- `requestPasswordReset(email)`: Generate token, send email
- `resetPassword(token, newPassword)`: Validate token, update password
- `validateResetToken(token)`: Check token validity

#### 2.3 Email Templates
**Files**: 
- `emails/password-reset.tsx`: Password reset email template
- Update `emails/index.tsx`: Add password reset email function

#### 2.4 Routes and Components
**New Routes**:
- `/forgot-password`: Request password reset
- `/reset-password/[token]`: Reset password form

**Components**:
- `ForgotPasswordForm`: Email input form
- `ResetPasswordForm`: New password form with validation

### Phase 3: Strengthen Password Validation

#### 3.1 Enhanced Password Schema
**File**: `lib/validator.ts`
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character
- Clear validation error messages

#### 3.2 Password Strength Indicator
**Component**: Real-time password strength feedback
- Visual strength meter
- Specific requirement checklist
- User-friendly guidance

### Phase 4: Profile Completion Flow

#### 4.1 Profile Completion Detection
**Logic**: Check if user has complete profile before checkout
- Redirect to profile completion if incomplete
- Allow guest checkout as alternative

#### 4.2 Profile Completion Components
**Components**:
- `ProfileCompletionForm`: Address and payment method collection
- `ProfileCompletionGuard`: Route protection for incomplete profiles

## Technical Implementation Details

### Security Considerations
1. **Password Reset Tokens**:
   - Cryptographically secure random generation
   - Short expiration time (15-30 minutes)
   - One-time use enforcement
   - Rate limiting for reset requests

2. **Password Validation**:
   - Client-side validation for UX
   - Server-side validation for security
   - Password hashing with bcrypt (already implemented)

3. **Email Security**:
   - Use existing Resend integration
   - Secure token transmission
   - Clear expiration messaging

### Database Migration Strategy
1. Add new fields to existing user documents
2. Set default values for existing users
3. Gradual migration without breaking existing functionality

### Backward Compatibility
- Existing users with incomplete profiles continue to work
- Admin-created users bypass profile completion requirements
- OAuth users get guided through profile completion

## Implementation Priority
1. **High Priority**: Fix registration validation (Phase 1)
2. **Medium Priority**: Password reset functionality (Phase 2)  
3. **Medium Priority**: Password strength validation (Phase 3)
4. **Low Priority**: Profile completion flow (Phase 4)

## Testing Strategy
1. Unit tests for validation schemas
2. Integration tests for registration flow
3. End-to-end tests for password reset flow
4. Manual testing of user experience

## Success Criteria
- [x] New users can register successfully with minimal information
- [x] Password reset flow works end-to-end
- [x] Strong password requirements enforced
- [ ] Profile completion guided during checkout
- [x] Existing functionality remains unaffected
- [x] Clear user feedback for all validation errors

## Implementation Status

### ✅ COMPLETED - Phase 1: Fix User Registration Validation
**Status**: Successfully implemented and tested
**Changes Made**:
- Modified user model to make address and payment method optional during registration
- Updated validation schemas to separate registration vs. profile completion requirements
- Fixed registerUser function to create users with minimal required data
- Added new UserProfileCompleteSchema for checkout validation

**Testing Results**: ✅ New users can now register successfully with just name, email, and password

### ✅ COMPLETED - Phase 2: Implement Password Reset Functionality
**Status**: Successfully implemented and tested
**Changes Made**:
- Created PasswordResetToken database model with secure token management
- Added password reset actions (requestPasswordReset, validateResetToken, resetPassword)
- Created password reset email template with proper styling
- Built forgot password and reset password pages with forms
- Added "Forgot Password" link to sign-in page
- Updated middleware to allow public access to password reset routes

**Testing Results**: ✅ Complete password reset flow working end-to-end (email sending limited by domain verification in dev)

### ✅ COMPLETED - Phase 3: Strengthen Password Validation
**Status**: Successfully implemented and tested
**Changes Made**:
- Enhanced password validation with comprehensive requirements:
  - Minimum 8 characters (was 3)
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character
- Clear, specific validation error messages for each requirement

**Testing Results**: ✅ Strong password validation working with clear user feedback

### 🔄 IN PROGRESS - Phase 4: Create Profile Completion Flow
**Status**: Lower priority - can be implemented as needed
**Scope**: Add guided profile completion during checkout for users with incomplete profiles

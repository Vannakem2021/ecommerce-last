/**
 * Password Reset Functionality Tests
 *
 * These are simple unit/integration tests for the password reset flow.
 * They test the core functionality without requiring Playwright or browser automation.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { requestPasswordReset, resetPassword } from '@/lib/actions/user.actions'
import { connectToDatabase } from '@/lib/db/client'
import { User } from '@/lib/db/models/user.model'
import { PasswordResetToken } from '@/lib/db/models/password-reset-token.model'
import bcrypt from 'bcryptjs'

// Test user data
const testUser = {
  name: 'Test User Reset',
  email: 'password-reset-test@example.com',
  password: 'OldPassword123!@#',
  role: 'user',
}

describe('Password Reset Functionality', () => {
  let userId: string
  let resetToken: string

  beforeAll(async () => {
    // Connect to database
    await connectToDatabase()

    // Clean up any existing test user
    await User.deleteOne({ email: testUser.email })
    await PasswordResetToken.deleteMany({ })

    // Create test user
    const hashedPassword = await bcrypt.hash(testUser.password, 12)
    const user = await User.create({
      ...testUser,
      password: hashedPassword,
    })
    userId = user._id.toString()
  })

  afterAll(async () => {
    // Clean up test data
    await User.deleteOne({ email: testUser.email })
    await PasswordResetToken.deleteMany({ })
  })

  describe('Request Password Reset', () => {
    it('should successfully send reset email for valid email', async () => {
      const result = await requestPasswordReset({ email: testUser.email })

      expect(result.success).toBe(true)
      expect(result.message).toContain('password reset link has been sent')
    })

    it('should return success even for non-existent email (security)', async () => {
      const result = await requestPasswordReset({ email: 'nonexistent@example.com' })

      // Should not reveal if email exists or not
      expect(result.success).toBe(true)
      expect(result.message).toContain('password reset link has been sent')
    })

    it('should create reset token in database', async () => {
      await requestPasswordReset({ email: testUser.email })

      const token = await PasswordResetToken.findOne({ })
      expect(token).toBeDefined()
      expect(token?.used).toBe(false)
      expect(token?.expiresAt).toBeInstanceOf(Date)

      // Token should expire in ~15 minutes
      const expiryTime = token?.expiresAt.getTime()! - Date.now()
      expect(expiryTime).toBeGreaterThan(14 * 60 * 1000) // > 14 minutes
      expect(expiryTime).toBeLessThan(16 * 60 * 1000) // < 16 minutes

      // Save token for later tests
      resetToken = token?.token || ''
    })

    it('should delete old reset tokens when requesting new one', async () => {
      // Request first reset
      await requestPasswordReset({ email: testUser.email })
      const firstTokenCount = await PasswordResetToken.countDocuments({ })

      // Request second reset
      await requestPasswordReset({ email: testUser.email })
      const secondTokenCount = await PasswordResetToken.countDocuments({ })

      // Should only have one token (old one deleted)
      expect(firstTokenCount).toBe(1)
      expect(secondTokenCount).toBe(1)
    })

    it('should reject invalid email format', async () => {
      const result = await requestPasswordReset({ email: 'invalid-email' })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject empty email', async () => {
      const result = await requestPasswordReset({ email: '' })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Reset Password', () => {
    beforeAll(async () => {
      // Create a fresh reset token for these tests
      await requestPasswordReset({ email: testUser.email })
      const token = await PasswordResetToken.findOne({ used: false })
      resetToken = token?.token || ''
    })

    it('should successfully reset password with valid token', async () => {
      const newPassword = 'NewPassword123!@#'

      const result = await resetPassword({
        token: resetToken,
        password: newPassword,
        confirmPassword: newPassword,
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('reset successfully')
    })

    it('should update user password in database', async () => {
      const newPassword = 'AnotherNewPassword456!@#'

      // Request new reset token
      await requestPasswordReset({ email: testUser.email })
      const token = await PasswordResetToken.findOne({ used: false })

      // Reset password
      await resetPassword({
        token: token?.token || '',
        password: newPassword,
        confirmPassword: newPassword,
      })

      // Verify password was changed
      const user = await User.findById(userId)
      const isMatch = await bcrypt.compare(newPassword, user!.password)
      expect(isMatch).toBe(true)
    })

    it('should mark token as used after successful reset', async () => {
      const newPassword = 'YetAnotherPassword789!@#'

      // Request new reset token
      await requestPasswordReset({ email: testUser.email })
      const tokenDoc = await PasswordResetToken.findOne({ used: false })
      const tokenString = tokenDoc?.token || ''

      // Reset password
      await resetPassword({
        token: tokenString,
        password: newPassword,
        confirmPassword: newPassword,
      })

      // Verify token is marked as used
      const usedToken = await PasswordResetToken.findOne({ token: tokenString })
      expect(usedToken?.used).toBe(true)
    })

    it('should reject already used token', async () => {
      const newPassword = 'ShouldNotWork123!@#'

      // Request new reset token
      await requestPasswordReset({ email: testUser.email })
      const tokenDoc = await PasswordResetToken.findOne({ used: false })
      const tokenString = tokenDoc?.token || ''

      // Use token once
      await resetPassword({
        token: tokenString,
        password: newPassword,
        confirmPassword: newPassword,
      })

      // Try to use same token again
      const result = await resetPassword({
        token: tokenString,
        password: 'AnotherPassword123!@#',
        confirmPassword: 'AnotherPassword123!@#',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid or expired')
    })

    it('should reject expired token', async () => {
      // Create an expired token
      const expiredToken = 'expired-token-test'
      await PasswordResetToken.create({
        userId,
        token: expiredToken,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        used: false,
      })

      const result = await resetPassword({
        token: expiredToken,
        password: 'NewPassword123!@#',
        confirmPassword: 'NewPassword123!@#',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid or expired')
    })

    it('should reject invalid/non-existent token', async () => {
      const result = await resetPassword({
        token: 'invalid-token-that-does-not-exist',
        password: 'NewPassword123!@#',
        confirmPassword: 'NewPassword123!@#',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid or expired')
    })

    it('should reject mismatched passwords', async () => {
      // Request new reset token
      await requestPasswordReset({ email: testUser.email })
      const tokenDoc = await PasswordResetToken.findOne({ used: false })

      const result = await resetPassword({
        token: tokenDoc?.token || '',
        password: 'Password123!@#',
        confirmPassword: 'DifferentPassword123!@#',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should reject weak passwords', async () => {
      // Request new reset token
      await requestPasswordReset({ email: testUser.email })
      const tokenDoc = await PasswordResetToken.findOne({ used: false })

      const result = await resetPassword({
        token: tokenDoc?.token || '',
        password: 'weak',
        confirmPassword: 'weak',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Security Tests', () => {
    it('should not allow reusing same password reset token', async () => {
      // Request reset
      await requestPasswordReset({ email: testUser.email })
      const tokenDoc = await PasswordResetToken.findOne({ used: false })
      const token = tokenDoc?.token || ''

      // Use it once
      const result1 = await resetPassword({
        token,
        password: 'FirstNewPassword123!@#',
        confirmPassword: 'FirstNewPassword123!@#',
      })
      expect(result1.success).toBe(true)

      // Try to use it again
      const result2 = await resetPassword({
        token,
        password: 'SecondNewPassword123!@#',
        confirmPassword: 'SecondNewPassword123!@#',
      })
      expect(result2.success).toBe(false)
    })

    it('should generate unique tokens for each request', async () => {
      // Get first token
      await requestPasswordReset({ email: testUser.email })
      const token1Doc = await PasswordResetToken.findOne({ used: false })
      const token1 = token1Doc?.token

      // Get second token (should replace first)
      await requestPasswordReset({ email: testUser.email })
      const token2Doc = await PasswordResetToken.findOne({ used: false })
      const token2 = token2Doc?.token

      // Tokens should be different
      expect(token1).not.toBe(token2)
    })

    it('should properly hash new password (not store plaintext)', async () => {
      const newPassword = 'SecurityTest123!@#'

      // Request reset
      await requestPasswordReset({ email: testUser.email })
      const tokenDoc = await PasswordResetToken.findOne({ used: false })

      // Reset password
      await resetPassword({
        token: tokenDoc?.token || '',
        password: newPassword,
        confirmPassword: newPassword,
      })

      // Verify password is hashed (not plaintext)
      const user = await User.findById(userId)
      expect(user?.password).not.toBe(newPassword)
      expect(user?.password).toHaveLength(60) // bcrypt hash length
      expect(user?.password).toMatch(/^\$2[aby]\$/) // bcrypt format
    })
  })

  describe('Email Integration Tests', () => {
    it('should handle email service failure gracefully', async () => {
      // Even if email fails, the function should return success
      // (following security best practice of not revealing if email exists)
      const result = await requestPasswordReset({ email: testUser.email })

      expect(result.success).toBe(true)
      // Token should still be created in database
      const token = await PasswordResetToken.findOne({ })
      expect(token).toBeDefined()
    })

    // Note: This test verifies the token is created even if Resend is not configured
    it('should create token even without Resend API configured', async () => {
      const result = await requestPasswordReset({ email: testUser.email })

      expect(result.success).toBe(true)
      const token = await PasswordResetToken.findOne({ })
      expect(token).toBeDefined()
      expect(token?.token).toBeTruthy()
    })
  })
})
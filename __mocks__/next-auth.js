// Mock for next-auth
module.exports = jest.fn(() => ({
  handlers: { GET: jest.fn(), POST: jest.fn() },
  auth: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id', name: 'Test User', email: 'test@example.com' },
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock for auth.ts
export const auth = jest.fn().mockResolvedValue({
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin',
  },
})

export const signIn = jest.fn()
export const signOut = jest.fn()
export const handlers = { GET: jest.fn(), POST: jest.fn() }

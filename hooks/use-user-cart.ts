/**
 * User-Aware Cart Hook
 * 
 * This hook integrates cart store with user authentication to ensure
 * proper cart isolation per user session.
 */

import { useEffect } from 'react'
import useCartStore from './use-cart-store'
import { useAuthSession } from './use-auth-session'

export function useUserCart() {
  const cartStore = useCartStore()
  const { user, status } = useAuthSession()
  
  // Initialize cart for current user when authentication state changes
  useEffect(() => {
    if (status === 'loading') return
    
    const userId = user?.id || null
    cartStore.initializeForUser(userId)
  }, [user?.id, status, cartStore])

  return cartStore
}

export default useUserCart
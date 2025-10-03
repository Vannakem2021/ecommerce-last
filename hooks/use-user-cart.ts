/**
 * User-Aware Cart Hook
 *
 * This hook integrates cart store with user authentication.
 * Cart items persist regardless of authentication state - users can
 * add items to cart without being signed in, and the cart will remain
 * even after they sign out. Authentication is only required at checkout.
 */

import { useEffect, useRef } from 'react'
import useCartStore from './use-cart-store'
import { useAuthSession } from './use-auth-session'

export function useUserCart() {
  const cartStore = useCartStore()
  const { user, status } = useAuthSession()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastUserIdRef = useRef<string | null | undefined>(undefined)

  // Update cart store with current user ID for tracking
  // Cart items will persist regardless of authentication state
  useEffect(() => {
    if (status === 'loading') return

    const userId = user?.id || null
    
    // Only initialize if user ID actually changed
    if (lastUserIdRef.current === userId) return
    lastUserIdRef.current = userId

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounced initialization to prevent excessive calls
    debounceRef.current = setTimeout(() => {
      try {
        cartStore.initializeForUser(userId)
      } catch (error) {
        console.error('Failed to initialize cart for user:', error)
      }
    }, 100) // 100ms debounce

    // Cleanup debounce on unmount
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
     
  }, [user?.id, status, cartStore])

  // Enhanced cart store with error handling wrappers
  const enhancedCartStore = {
    ...cartStore,
    addItem: async (item: any, quantity: number) => {
      try {
        return await cartStore.addItem(item, quantity)
      } catch (error) {
        console.error('Failed to add item to cart:', error)
        throw error
      }
    },
    updateItem: async (item: any, quantity: number) => {
      try {
        await cartStore.updateItem(item, quantity)
      } catch (error) {
        console.error('Failed to update cart item:', error)
        throw error
      }
    },
    removeItem: async (item: any) => {
      try {
        await cartStore.removeItem(item)
      } catch (error) {
        console.error('Failed to remove cart item:', error)
        throw error
      }
    },
  }

  return enhancedCartStore
}

export default useUserCart
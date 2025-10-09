import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Cart, OrderItem, ShippingAddress, PromotionValidationResult } from '@/types'
import { calcDeliveryDateAndPrice } from '@/lib/actions/order.actions'
import { validatePromotionCode } from '@/lib/actions/promotion.actions'
import { round2 } from '@/lib/utils'

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  taxPrice: undefined,
  shippingPrice: undefined,
  totalPrice: 0,
  paymentMethod: undefined,
  shippingAddress: undefined,
  deliveryDateIndex: undefined,
  appliedPromotion: undefined,
  discountAmount: undefined,
}

// Client-side price calculation function to reduce server calls
const calculateClientSidePrices = (items: OrderItem[]) => {
  const itemsPrice = round2(
    items.reduce((acc, item) => {
      // Guard against undefined price/quantity, mirroring server-side guard
      if (!item.price || !item.quantity) return acc
      return acc + item.price * item.quantity
    }, 0)
  )
  return {
    itemsPrice,
    // Basic totals without server-side shipping/tax calculations
    totalPrice: itemsPrice
  }
}

interface CartState {
  cart: Cart
  currentUserId: string | null
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => Promise<void>
  clearCart: () => void
  setShippingAddress: (shippingAddress: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  setDeliveryDateIndex: (index: number) => Promise<void>
  applyPromotion: (code: string, userId?: string) => Promise<PromotionValidationResult>
  removePromotion: () => Promise<void>
  recalculateServerPrices: () => Promise<void>
  initializeForUser: (userId: string | null) => void
  init: () => void
}

const useCartStore = create(
  persist<CartState>(
    (set, get) => {
      // Debounced promotion recalculation
      let promotionRecalcDebounce: ReturnType<typeof setTimeout> | null = null

      const schedulePromotionRecalc = () => {
        if (promotionRecalcDebounce) {
          clearTimeout(promotionRecalcDebounce)
        }
        promotionRecalcDebounce = setTimeout(async () => {
          const { appliedPromotion, items, shippingAddress, deliveryDateIndex } = get().cart
          if (appliedPromotion) {
            try {
              const serverPrices = await calcDeliveryDateAndPrice({
                items,
                shippingAddress,
                deliveryDateIndex,
              })

              // Re-apply free shipping if promotion includes it
              let finalShippingPrice = serverPrices.shippingPrice
              if (appliedPromotion.freeShipping) {
                finalShippingPrice = 0
              }

              // Recalculate final totals with promotion
              const baseTotal = serverPrices.itemsPrice +
                (finalShippingPrice || 0) +
                (serverPrices.taxPrice || 0)
              const finalTotalPrice = baseTotal - appliedPromotion.discountAmount

              set({
                cart: {
                  ...get().cart,
                  ...serverPrices,
                  shippingPrice: finalShippingPrice,
                  totalPrice: Math.max(0, finalTotalPrice),
                },
              })
            } catch (error) {
              console.error('Failed to recalculate promotion prices:', error)
            }
          }
        }, 500) // 500ms debounce
      }

      return {
        cart: initialState,
        currentUserId: null,

      addItem: async (item: OrderItem, quantity: number) => {
        const { items } = get().cart
        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

        if (existItem) {
          if (existItem.countInStock < quantity + existItem.quantity) {
            throw new Error('Not enough items in stock')
          }
        } else {
          if (item.countInStock < quantity) {
            throw new Error('Not enough items in stock')
          }
        }

        const updatedCartItems = existItem
          ? items.map((x) =>
              x.product === item.product &&
              x.color === item.color &&
              x.size === item.size
                ? { ...existItem, quantity: existItem.quantity + quantity }
                : x
            )
          : [...items, { ...item, quantity }]

        // Use client-side calculation for immediate response
        const clientPrices = calculateClientSidePrices(updatedCartItems)

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...clientPrices,
          },
        })

        // Schedule promotion recalculation if promotion is applied
        const { appliedPromotion } = get().cart
        if (appliedPromotion) {
          schedulePromotionRecalc()
        }

        const foundItem = updatedCartItems.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!foundItem) {
          throw new Error('Item not found in cart')
        }
        return foundItem.clientId
      },
      updateItem: async (item: OrderItem, quantity: number) => {
        const { items } = get().cart
        const exist = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!exist) return
        const updatedCartItems = items.map((x) =>
          x.product === item.product &&
          x.color === item.color &&
          x.size === item.size
            ? { ...exist, quantity: quantity }
            : x
        )

        // Use client-side calculation for immediate response
        const clientPrices = calculateClientSidePrices(updatedCartItems)

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...clientPrices,
          },
        })

        // Schedule promotion recalculation if promotion is applied
        const { appliedPromotion } = get().cart
        if (appliedPromotion) {
          schedulePromotionRecalc()
        }
      },
      removeItem: async (item: OrderItem) => {
        const { items } = get().cart
        const updatedCartItems = items.filter(
          (x) =>
            x.product !== item.product ||
            x.color !== item.color ||
            x.size !== item.size
        )

        // Use client-side calculation for immediate response
        const clientPrices = calculateClientSidePrices(updatedCartItems)

        set({
          cart: {
            ...get().cart,
            items: updatedCartItems,
            ...clientPrices,
          },
        })

        // Schedule promotion recalculation if promotion is applied
        const { appliedPromotion } = get().cart
        if (appliedPromotion) {
          schedulePromotionRecalc()
        }
      },
      setShippingAddress: async (shippingAddress: ShippingAddress) => {
        const { items, appliedPromotion } = get().cart
        try {
          const serverPrices = await calcDeliveryDateAndPrice({
            items,
            shippingAddress,
          })

          // Re-apply free shipping if promotion includes it
          let finalShippingPrice = serverPrices.shippingPrice
          if (appliedPromotion?.freeShipping) {
            finalShippingPrice = 0
          }

          set({
            cart: {
              ...get().cart,
              shippingAddress,
              ...serverPrices,
              shippingPrice: finalShippingPrice,
            },
          })
        } catch (error) {
          // Fallback to client-side calculation if server fails
          const clientPrices = calculateClientSidePrices(items)
          set({
            cart: {
              ...get().cart,
              shippingAddress,
              ...clientPrices,
              shippingPrice: appliedPromotion?.freeShipping ? 0 : undefined,
            },
          })
          console.error('Server calculation failed, using client fallback:', error)
        }
      },
      setPaymentMethod: (paymentMethod: string) => {
        set({
          cart: {
            ...get().cart,
            paymentMethod,
          },
        })
      },
      setDeliveryDateIndex: async (index: number) => {
        const { items, shippingAddress, appliedPromotion } = get().cart

        try {
          const serverPrices = await calcDeliveryDateAndPrice({
            items,
            shippingAddress,
            deliveryDateIndex: index,
          })

          // Re-apply free shipping if promotion includes it
          let finalShippingPrice = serverPrices.shippingPrice
          if (appliedPromotion?.freeShipping) {
            finalShippingPrice = 0
          }

          set({
            cart: {
              ...get().cart,
              ...serverPrices,
              shippingPrice: finalShippingPrice,
            },
          })
        } catch (error) {
          // Fallback to client-side calculation if server fails
          const clientPrices = calculateClientSidePrices(items)
          set({
            cart: {
              ...get().cart,
              deliveryDateIndex: index,
              ...clientPrices,
              shippingPrice: appliedPromotion?.freeShipping ? 0 : undefined,
            },
          })
          console.error('Server calculation failed, using client fallback:', error)
        }
      },
      clearCart: () => {
        set({
          cart: initialState,
        })
      },

      applyPromotion: async (code: string, userId?: string) => {
        const currentCart = get().cart

        try {
          const result = await validatePromotionCode(code, currentCart, userId)

          if (result.success && result.discount !== undefined && result.promotion) {
            // Calculate original total before discount with safe itemsPrice
            const safeItemsPrice = typeof currentCart.itemsPrice === 'number' && !isNaN(currentCart.itemsPrice)
              ? currentCart.itemsPrice
              : calculateClientSidePrices(currentCart.items).itemsPrice
            const originalTotal = safeItemsPrice + (currentCart.shippingPrice || 0) + (currentCart.taxPrice || 0)

            const appliedPromotion = {
              code: code.toUpperCase(),
              discountAmount: result.discount,
              promotionId: result.promotion._id,
              originalTotal: originalTotal,
              freeShipping: result.freeShipping || false,
            }

            // Recalculate cart with promotion
            const updatedCart = {
              ...currentCart,
              appliedPromotion,
              discountAmount: result.discount,
            }

            // Recalculate delivery and prices
            const priceCalculation = await calcDeliveryDateAndPrice({
              items: updatedCart.items,
              shippingAddress: updatedCart.shippingAddress,
              deliveryDateIndex: updatedCart.deliveryDateIndex,
            })

            // Apply free shipping if promotion includes it
            let finalShippingPrice = priceCalculation.shippingPrice
            if (result.freeShipping) {
              finalShippingPrice = 0
            }

            // Calculate final total: use calculated total with adjusted shipping minus discount
            const baseTotal = priceCalculation.itemsPrice +
              (finalShippingPrice || 0) +
              (priceCalculation.taxPrice || 0)
            const finalTotalPrice = baseTotal - result.discount

            set({
              cart: {
                ...updatedCart,
                ...priceCalculation,
                shippingPrice: finalShippingPrice,
                totalPrice: Math.max(0, finalTotalPrice), // Ensure total is not negative
              },
            })
          }

          return result
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to apply promotion'
          }
        }
      },

      removePromotion: async () => {
        const currentCart = get().cart

        // Remove promotion and recalculate
        const updatedCart = {
          ...currentCart,
          appliedPromotion: undefined,
          discountAmount: undefined,
        }

        try {
          const priceCalculation = await calcDeliveryDateAndPrice({
            items: updatedCart.items,
            shippingAddress: updatedCart.shippingAddress,
            deliveryDateIndex: updatedCart.deliveryDateIndex,
          })

          set({
            cart: {
              ...updatedCart,
              ...priceCalculation,
            },
          })
        } catch (error) {
          // Fallback to client-side calculation if server fails
          const clientPrices = calculateClientSidePrices(updatedCart.items)
          set({
            cart: {
              ...updatedCart,
              ...clientPrices,
            },
          })
          console.error('Server calculation failed, using client fallback:', error)
        }
      },

      recalculateServerPrices: async () => {
        const { items, shippingAddress, deliveryDateIndex, appliedPromotion } = get().cart
        try {
          const serverPrices = await calcDeliveryDateAndPrice({
            items,
            shippingAddress,
            deliveryDateIndex,
          })

          // Re-apply free shipping if promotion includes it
          let finalShippingPrice = serverPrices.shippingPrice
          if (appliedPromotion?.freeShipping) {
            finalShippingPrice = 0
          }

          set({
            cart: {
              ...get().cart,
              ...serverPrices,
              shippingPrice: finalShippingPrice,
            },
          })
        } catch (error) {
          console.error('Failed to recalculate server prices:', error)
          // Keep current client-side prices if server fails
        }
      },

      initializeForUser: (userId: string | null) => {
        const state = get()
        const prevUserId = state.currentUserId
        const sameUser = !!prevUserId && !!userId && prevUserId === userId

        if (!sameUser) {
          // Clear sensitive fields on user change/sign-out while preserving cart items
          // Reset stale prices and recalculate client-side totals
          const clientPrices = calculateClientSidePrices(state.cart.items)
          set({
            currentUserId: userId,
            cart: {
              ...state.cart,
              shippingAddress: undefined,
              paymentMethod: undefined,
              appliedPromotion: undefined,
              discountAmount: undefined,
              shippingPrice: undefined,
              taxPrice: undefined,
              deliveryDateIndex: undefined,
              ...clientPrices,
            }
          })
        } else {
          // Same user, just update the user ID
          set({ currentUserId: userId })
        }
      },

      init: () => set({ cart: initialState }),
      }
    },

    {
      name: 'cart-store',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      partialize: (state) => ({
        cart: {
          items: state.cart.items,
        },
        currentUserId: state.currentUserId,
      }) as any,
    }
  )
)
export default useCartStore

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
type BrowsingHistory = {
  products: { id: string; category: string }[]
}
const initialState: BrowsingHistory = {
  products: [],
}

export const browsingHistoryStore = create<BrowsingHistory>()(
  persist(() => initialState, {
    name: 'browsingHistoryStore',
  })
)

export default function useBrowsingHistory() {
  const { products } = browsingHistoryStore()
  return {
    products,
    addItem: (product: { id: string; category: string }) => {
      const index = products.findIndex((p) => p.id === product.id)
      
      // If product is already at the top, don't update
      if (index === 0) return
      
      const newProducts = [...products]
      
      if (index !== -1) newProducts.splice(index, 1) // Remove duplicate if it exists
      newProducts.unshift(product) // Add id to the start

      if (newProducts.length > 10) newProducts.pop() // Remove excess items if length exceeds 10

      browsingHistoryStore.setState({
        products: newProducts,
      })
    },

    clear: () => {
      browsingHistoryStore.setState({
        products: [],
      })
    },
  }
}

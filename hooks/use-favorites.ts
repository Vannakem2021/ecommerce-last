'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect } from 'react'
import { useAuthSession } from './use-auth-session'
import {
  addFavorite as addFavoriteAction,
  removeFavorite as removeFavoriteAction,
  toggleFavorite as toggleFavoriteAction,
  getMyFavoriteIds,
} from '@/lib/actions/favorite.actions'

type FavoritesState = {
  ids: string[]
  currentUserId: string | null
  loaded: boolean
  loading: boolean
  initializeForUser: (userId: string | null) => Promise<void>
  isFavorite: (id: string) => boolean
  add: (id: string) => Promise<{ success: boolean; message: string }>
  remove: (id: string) => Promise<{ success: boolean; message: string }>
  toggle: (
    id: string
  ) => Promise<{ success: boolean; message: string; isFavorite?: boolean }>
  clearAll: () => void
}

const useFavoritesStore = create(
  persist<FavoritesState>(
    (set, get) => ({
      ids: [],
      currentUserId: null,
      loaded: false,
      loading: false,

      initializeForUser: async (userId: string | null) => {
        // If unchanged and already loaded, skip
        if (get().currentUserId === userId && get().loaded) return
        // Reset state when user changes or logs out
        set({ ids: [], currentUserId: userId, loaded: false, loading: !!userId })
        if (!userId) {
          set({ loaded: true, loading: false })
          return
        }
        try {
          const ids = await getMyFavoriteIds()
          set({ ids, loaded: true })
        } catch {
          set({ ids: [], loaded: true })
        } finally {
          set({ loading: false })
        }
      },

      isFavorite: (id: string) => get().ids.includes(id),

      add: async (id: string) => {
        if (get().ids.includes(id)) return { success: true, message: 'Added to Favorites' }
        // Optimistic add using functional update to avoid races
        set((state) => ({ ids: state.ids.includes(id) ? state.ids : [id, ...state.ids] }))
        const res = await addFavoriteAction(id)
        if (!res.success) {
          // Revert only the added id
          set((state) => ({ ids: state.ids.filter((x) => x !== id) }))
        }
        return res
      },

      remove: async (id: string) => {
        if (!get().ids.includes(id)) return { success: true, message: 'Removed from Favorites' }
        // Optimistic remove
        set((state) => ({ ids: state.ids.filter((x) => x !== id) }))
        const res = await removeFavoriteAction(id)
        if (!res.success) {
          // Revert by adding back if it was removed
          set((state) => ({ ids: state.ids.includes(id) ? state.ids : [id, ...state.ids] }))
        }
        return res
      },

      toggle: async (id: string) => {
        // Optimistic toggle with functional update to avoid races
        set((state) => {
          const isFav = state.ids.includes(id)
          return { ids: isFav ? state.ids.filter((x) => x !== id) : [id, ...state.ids] }
        })
        const res = await toggleFavoriteAction(id)
        if (!res.success) {
          // Revert by toggling again
          set((state) => {
            const isFav = state.ids.includes(id)
            return { ids: isFav ? state.ids.filter((x) => x !== id) : [id, ...state.ids] }
          })
        }
        return res
      },

      clearAll: () => set({ ids: [] }),
    }),
    {
      name: 'favorites-store',
      // Only persist the essential bits
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      partialize: (s) => ({ ids: s.ids, currentUserId: s.currentUserId }) as any,
    }
  )
)

export default function useFavorites() {
  const auth = useAuthSession()
  const store = useFavoritesStore()

  useEffect(() => {
    store.initializeForUser(auth.user?.id || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user?.id])

  return store
}


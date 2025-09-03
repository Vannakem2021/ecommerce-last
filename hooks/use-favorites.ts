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
        const prev = get().ids
        if (prev.includes(id)) return { success: true, message: 'Added to Favorites' }
        set({ ids: [id, ...prev] })
        const res = await addFavoriteAction(id)
        if (!res.success) set({ ids: prev })
        return res
      },

      remove: async (id: string) => {
        const prev = get().ids
        if (!prev.includes(id)) return { success: true, message: 'Removed from Favorites' }
        set({ ids: prev.filter((x) => x !== id) })
        const res = await removeFavoriteAction(id)
        if (!res.success) set({ ids: prev })
        return res
      },

      toggle: async (id: string) => {
        const prev = get().ids
        const isFav = prev.includes(id)
        set({ ids: isFav ? prev.filter((x) => x !== id) : [id, ...prev] })
        const res = await toggleFavoriteAction(id)
        if (!res.success) set({ ids: prev })
        return res
      },

      clearAll: () => set({ ids: [] }),
    }),
    { name: 'favorites-store' }
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


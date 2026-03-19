import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WishlistItem {
  productId: string
  name: string
  slug: string
  price: number
  image?: string
  category: string
}

interface WishlistStore {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  getTotalItems: () => number
  clearWishlist: () => void
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: state.items.some(i => i.productId === item.productId)
            ? state.items
            : [...state.items, item]
        })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter(i => i.productId !== productId)
        })),
      isInWishlist: (productId) => {
        const state = get()
        return state.items.some(i => i.productId === productId)
      },
      getTotalItems: () => get().items.length,
      clearWishlist: () => set({ items: [] })
    }),
    {
      name: 'wishlist-storage'
    }
  )
)

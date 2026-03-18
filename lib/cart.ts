import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  quantity: number
  size?: string
  color?: string
  price: number
  name: string
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, size?: string, color?: string) => void
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: CartItem) => {
        set((state) => {
          // Check if item with same productId, size, and color already exists
          const existingIndex = state.items.findIndex(
            (i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.color === item.color
          )

          if (existingIndex >= 0) {
            // Item exists, increase quantity
            const updatedItems = [...state.items]
            updatedItems[existingIndex].quantity += item.quantity
            return { items: updatedItems }
          } else {
            // New item, add to cart
            return { items: [...state.items, item] }
          }
        })
      },

      removeItem: (productId: string, size?: string, color?: string) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(i.productId === productId && i.size === size && i.color === color)
          ),
        }))
      },

      updateQuantity: (
        productId: string,
        quantity: number,
        size?: string,
        color?: string
      ) => {
        set((state) => {
          const updatedItems = state.items.map((i) =>
            i.productId === productId && i.size === size && i.color === color
              ? { ...i, quantity: Math.max(0, quantity) }
              : i
          )
          return { items: updatedItems.filter((i) => i.quantity > 0) }
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
    }),
    {
      name: 'fashion-cart',
    }
  )
)

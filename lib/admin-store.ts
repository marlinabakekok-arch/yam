import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AdminUser {
  id: string
  email: string
  name: string
  createdAt: string
}

interface AdminStore {
  admin: AdminUser | null
  setAdmin: (admin: AdminUser) => void
  logout: () => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      admin: null,
      setAdmin: (admin) => set({ admin }),
      logout: () => {
        set({ admin: null })
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin-store')
        }
      },
    }),
    {
      name: 'admin-store',
    }
  )
)

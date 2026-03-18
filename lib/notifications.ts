import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserNotification {
  id: string
  userId: string
  notificationId: string
  isRead: boolean
  readAt?: Date
  createdAt: string
  notification: {
    id: string
    title: string
    message: string
    type: string
    image?: string
    link?: string
    createdAt: string
  }
}

interface NotificationStore {
  notifications: UserNotification[]
  unreadCount: number
  setNotifications: (notifications: UserNotification[]) => void
  markAsRead: (id: string) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  getUnreadCount: () => number
}

export const useNotifications = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.isRead).length
        set({ notifications, unreadCount })
      },

      markAsRead: (id) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          )
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          }
        })
      },

      removeNotification: (id) => {
        set((state) => {
          const updated = state.notifications.filter((n) => n.id !== id)
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          }
        })
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 })
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length
      },
    }),
    {
      name: 'notifications-store',
    }
  )
)

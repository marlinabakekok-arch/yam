'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { Bell, X, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useNotifications } from '@/lib/notifications'

interface UserNotification {
  id: string
  userId: string
  notificationId: string
  isRead: boolean
  readAt?: string
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

export default function NotificationsPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { setNotifications, notifications: storeNotifications } = useNotifications()

  const [notifications, setLoadedNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      router.push('/sign-in')
      return
    }

    fetchNotifications()
  }, [isLoaded, user, router])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setLoadedNotifications(data)
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
      })
      if (res.ok) {
        setLoadedNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setLoadedNotifications((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  if (!mounted || !isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Notifications
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            <Bell className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        {/* Notifications */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            icon="📭"
            title="No notifications yet"
            description="You'll see notifications about new products, promotions, and more here"
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`cursor-pointer transition-all ${
                  notif.isRead
                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                    : 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900 border-l-4'
                }`}
                onClick={() => {
                  if (!notif.isRead) handleMarkAsRead(notif.id)
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    {/* Icon/Image */}
                    <div className="flex-shrink-0">
                      {notif.notification.image ? (
                        <img
                          src={notif.notification.image}
                          alt={notif.notification.title}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                          <Bell className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            {notif.notification.title}
                            {!notif.isRead && (
                              <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                            )}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {notif.notification.message}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notif.id)
                          }}
                          className="flex-shrink-0 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4 text-slate-500" />
                        </button>
                      </div>

                      {/* Meta */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              notif.notification.type === 'promotion'
                                ? 'border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300'
                                : notif.notification.type === 'alert'
                                ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-300'
                                : notif.notification.type === 'new_product'
                                ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-300'
                                : 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300'
                            }
                          >
                            {notif.notification.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {notif.isRead && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>

                      {/* CTA Link */}
                      {notif.notification.link && (
                        <div className="mt-3">
                          <a href={notif.notification.link} className="inline-flex">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View →
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

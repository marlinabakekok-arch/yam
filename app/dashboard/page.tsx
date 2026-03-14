'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import useSWR from 'swr'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { User, BookOpen, ShoppingBag } from 'lucide-react'

interface Enrollment {
  id: string
  kelas: {
    id: string
    title: string
    slug: string
  }
}

interface Order {
  id: string
  txId: string
  amount: string
  status: string
  paidAt: string | null
  kelas: {
    title: string
    slug: string
  }
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [activeTab, setActiveTab] = useState('overview')

  const { data: enrollments, isLoading: enrollmentsLoading } = useSWR<Enrollment[]>(
    '/api/dashboard/enrollments',
    fetcher,
    { revalidateOnFocus: false }
  )

  const { data: orders, isLoading: ordersLoading } = useSWR<Order[]>(
    '/api/dashboard/orders',
    fetcher,
    { revalidateOnFocus: false }
  )

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage your profile and enrolled classes
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            My Classes
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Order History
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* My Classes Tab */}
        <TabsContent value="overview" className="space-y-4">
          {enrollmentsLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : enrollments && enrollments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {enrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/kelas/${enrollment.kelas.slug}`}
                >
                  <Card className="h-full transition-all hover:shadow-lg hover:ring-2 hover:ring-indigo-600">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">
                        {enrollment.kelas.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        ✓ Enrolled
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="No Classes Yet"
              description="You haven't enrolled in any classes yet. Browse our available classes to get started."
            />
          )}
        </TabsContent>

        {/* Order History Tab */}
        <TabsContent value="orders" className="space-y-4">
          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {order.kelas.title}
                        </CardTitle>
                        <CardDescription>
                          Transaction ID: {order.txId}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-indigo-600">
                          Rp {parseInt(order.amount).toLocaleString('id-ID')}
                        </p>
                        <p className={`text-sm font-medium ${
                          order.status === 'success'
                            ? 'text-green-600'
                            : 'text-amber-600'
                        }`}>
                          {order.status === 'success' ? '✓ Paid' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                    {order.paidAt ? (
                      <>
                        Paid on {new Date(order.paidAt).toLocaleDateString('id-ID')}
                      </>
                    ) : (
                      <>Payment pending</>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              title="No Orders"
              description="You haven't made any purchases yet."
            />
          )}
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Name
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Email
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Account Created
                </p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('id-ID')
                    : '-'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

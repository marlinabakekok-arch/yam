'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Empty } from '@/components/ui/empty'
import { User, ShoppingBag, FileText, Heart, LogOut, Trash2, Download, MapPin, Star, Eye, Zap, Plus, Edit2 } from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { useWishlist } from '@/lib/wishlist'
import useSWR from 'swr'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Order {
  id: string
  txId: string
  amount: number
  status: string
  createdAt: string
  items: OrderItem[]
}

interface Statistics {
  totalSpent: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{
    productId: string
    name: string
    slug: string
    image: string | null
    quantity: number
  }>
}

interface Address {
  id: string
  name: string
  fullName: string
  phone: string
  address: string
  city: string
  province: string
  postalCode: string
  isDefault: boolean
}

interface Review {
  id: string
  productId: string
  rating: number
  title: string
  comment: string
  createdAt: string
  product: {
    name: string
    slug: string
    images: string[]
  }
}

interface RecentlyViewed {
  id: string
  productId: string
  viewedAt: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
  }
}

interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minPurchase: number
  maxUses: number | null
  usedCount: number
}

interface OrderItem {
  id: string
  productId: string
  product: {
    name: string
    slug: string
    price: number
  }
  quantity: number
  size?: string
  color?: string
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { items: wishlistItems, removeItem: removeFromWishlist } = useWishlist()

  // New state for new features
  const [addressForm, setAddressForm] = useState({
    name: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    isDefault: false,
  })
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [reviewForm, setReviewForm] = useState({
    productId: '',
    rating: 5,
    title: '',
    comment: '',
  })

  // SWR hooks for new features - with real-time updates
  const { data: statistics, mutate: mutateStats } = useSWR<Statistics>('/api/dashboard/statistics', {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 3000, // Update every 3 seconds for real-time
  })
  const { data: addresses, mutate: mutateAddresses } = useSWR<Address[]>('/api/dashboard/addresses', {
    revalidateOnFocus: true,
    refreshInterval: 5000,
  })
  const { data: reviews, mutate: mutateReviews } = useSWR<Review[]>('/api/dashboard/reviews', {
    revalidateOnFocus: true,
    refreshInterval: 5000,
  })
  const { data: recentlyViewed } = useSWR<RecentlyViewed[]>('/api/dashboard/recently-viewed', {
    revalidateOnFocus: true,
    refreshInterval: 5000,
  })
  const { data: coupons } = useSWR<Coupon[]>('/api/dashboard/coupons', {
    revalidateOnFocus: true,
    refreshInterval: 30000, // Update every 30 seconds
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isLoaded && user) {
      fetchOrders()
    }
  }, [isLoaded, user])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/dashboard/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  // Address handlers
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingAddressId ? 'PUT' : 'POST'
      const url = editingAddressId
        ? `/api/dashboard/addresses?id=${editingAddressId}`
        : '/api/dashboard/addresses'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      })

      if (res.ok) {
        setAddressForm({
          name: '',
          fullName: '',
          phone: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
          isDefault: false,
        })
        setEditingAddressId(null)
        mutateAddresses()
      }
    } catch (err) {
      console.error('Save address error:', err)
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Delete this address?')) return
    try {
      const res = await fetch(`/api/dashboard/addresses?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        mutateAddresses()
      }
    } catch (err) {
      console.error('Delete address error:', err)
    }
  }

  // Review handlers
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/dashboard/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      })

      if (res.ok) {
        setReviewForm({ productId: '', rating: 5, title: '', comment: '' })
        mutateReviews()
      }
    } catch (err) {
      console.error('Save review error:', err)
    }
  }

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete this review?')) return
    try {
      const res = await fetch(`/api/dashboard/reviews?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        mutateReviews()
      }
    } catch (err) {
      console.error('Delete review error:', err)
    }
  }

  const handleDownloadInvoice = (orderId: string, txId: string) => {
    window.location.href = `/api/dashboard/invoices?orderId=${orderId}`
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome, {user?.firstName}! 👋
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Manage your orders and profile
            </p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="hidden sm:flex gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 lg:w-auto overflow-x-auto">
            <TabsTrigger value="orders" className="flex items-center gap-1 text-xs md:text-sm">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-1 text-xs md:text-sm">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-1 text-xs md:text-sm">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Address</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-1 text-xs md:text-sm">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="recently-viewed" className="flex items-center gap-1 text-xs md:text-sm">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Viewed</span>
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-1 text-xs md:text-sm">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Promo</span>
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="flex items-center gap-1 text-xs md:text-sm">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Wishlist</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1 text-xs md:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Your Statistics
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Overview of your shopping activity
              </p>
            </div>

            {!statistics ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Total Spent</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                          Rp {statistics.totalSpent.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Total Orders</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                          {statistics.totalOrders}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-slate-600 dark:text-slate-400 text-sm">Average Order</p>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                          Rp {statistics.averageOrderValue.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {statistics.topProducts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top Purchased Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {statistics.topProducts.map((product) => (
                        <Link
                          key={product.productId}
                          href={`/product/${product.slug}`}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {product.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Purchased {product.quantity}x
                            </p>
                          </div>
                        </Link>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Address Book
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage your delivery addresses
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Address
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingAddressId ? 'Edit Address' : 'Add New Address'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Label (e.g., Home, Office)</Label>
                    <Input
                      id="name"
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      placeholder="Home"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Province</Label>
                      <Input
                        id="province"
                        value={addressForm.province}
                        onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isDefault">Set as default</Label>
                  </div>
                  <Button type="submit" className="w-full">
                    {editingAddressId ? 'Update' : 'Save'} Address
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {!addresses || addresses.length === 0 ? (
              <Empty title="No Addresses" description="Add your first address!" />
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <Card key={address.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {address.name}
                            </p>
                            {address.isDefault && (
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400">
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {address.fullName} • {address.phone}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                            {address.address}
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {address.city}, {address.province} {address.postalCode}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setAddressForm(address)
                              setEditingAddressId(address.id)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Your Reviews
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Write and manage product reviews
              </p>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Write Review
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveReview} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productId">Product ID</Label>
                    <Input
                      id="productId"
                      value={reviewForm.productId}
                      onChange={(e) => setReviewForm({ ...reviewForm, productId: e.target.value })}
                      placeholder="Enter product ID"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <Select value={String(reviewForm.rating)} onValueChange={(v) => setReviewForm({ ...reviewForm, rating: parseInt(v) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">⭐ 1 - Poor</SelectItem>
                        <SelectItem value="2">⭐⭐ 2 - Fair</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 3 - Good</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 4 - Very Good</SelectItem>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Review Title</Label>
                    <Input
                      id="title"
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                      placeholder="e.g., Great quality!"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment">Comment</Label>
                    <Textarea
                      id="comment"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your experience with this product..."
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Post Review
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {!reviews || reviews.length === 0 ? (
              <Empty title="No Reviews Yet" description="Your reviews will appear here!" />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <Link
                          href={`/product/${review.product.slug}`}
                          className="flex-1 hover:text-purple-600 dark:hover:text-purple-400"
                        >
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {review.title}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {review.product.name}
                          </p>
                        </Link>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-yellow-400">
                          {'⭐'.repeat(review.rating)}
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-sm">
                        {review.comment}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-3">
                        {new Date(review.createdAt).toLocaleDateString('id-ID')}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Recently Viewed Tab */}
          <TabsContent value="recently-viewed" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Recently Viewed
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Items you've recently looked at
              </p>
            </div>

            {!recentlyViewed || recentlyViewed.length === 0 ? (
              <Empty title="Nothing Viewed Yet" description="Start exploring our collection!" />
            ) : (
              <div className="space-y-4">
                {recentlyViewed.map((item) => (
                  <Card key={item.productId} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 p-4">
                      <div className="hidden sm:block h-24 w-24 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        {item.product.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-3xl">👗</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-2">
                          Rp {item.product.price.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Viewed: {new Date(item.viewedAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>

                      <Button asChild>
                        <Link href={`/product/${item.product.slug}`}>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Available Promo Codes
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Discover discounts and special offers
              </p>
            </div>

            {!coupons || coupons.length === 0 ? (
              <Empty title="No Promo Codes Available" description="Check back later for new offers!" />
            ) : (
              <div className="space-y-4">
                {coupons.map((coupon) => {
                  const isUsed = coupon.maxUses && coupon.usedCount >= coupon.maxUses
                  return (
                    <Card key={coupon.id} className={isUsed ? 'opacity-60' : ''}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded font-mono text-sm font-bold text-purple-600 dark:text-purple-400">
                                {coupon.code}
                              </code>
                              {isUsed && (
                                <Badge variant="destructive">Used Up</Badge>
                              )}
                            </div>
                            {coupon.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                {coupon.description}
                              </p>
                            )}
                            <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                              <p>
                                {coupon.discountType === 'percentage'
                                  ? `${coupon.discountValue}% discount`
                                  : `Rp ${coupon.discountValue.toLocaleString('id-ID')} discount`}
                              </p>
                              {coupon.minPurchase > 0 && (
                                <p>Min. purchase: Rp {coupon.minPurchase.toLocaleString('id-ID')}</p>
                              )}
                              {coupon.maxUses && (
                                <p>{coupon.maxUses - coupon.usedCount} uses left</p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(coupon.code)
                              alert('Coupon code copied!')
                            }}
                            disabled={isUsed}
                          >
                            Copy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab - Enhanced with Download Invoice */}
          <TabsContent value="orders" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Your Orders
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track and manage all your purchases
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            ) : orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => {
                  // Helper function to get badge color and text based on status
                  const getStatusBadge = (status: string) => {
                    const statusLower = status?.toLowerCase() || 'pending'
                    
                    if (statusLower === 'paid' || statusLower === 'success') {
                      return {
                        color: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
                        text: '✓ Paid',
                        icon: '✓'
                      }
                    } else if (statusLower === 'expired') {
                      return {
                        color: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
                        text: '✗ Expired',
                        icon: '✗'
                      }
                    } else if (statusLower === 'failed') {
                      return {
                        color: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
                        text: '✗ Failed',
                        icon: '✗'
                      }
                    } else {
                      return {
                        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
                        text: '⏳ Pending',
                        icon: '⏳'
                      }
                    }
                  }

                  const statusBadge = getStatusBadge(order.status)

                  return (
                    <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-50 dark:from-purple-950/30 dark:to-purple-950/20 pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">
                              Order {order.txId.substring(0, 8).toUpperCase()}
                            </CardTitle>
                            <CardDescription>
                              {new Date(order.createdAt).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusBadge.color}>
                              {statusBadge.text}
                            </Badge>
                            {order.status.toLowerCase() === 'paid' || order.status.toLowerCase() === 'success' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadInvoice(order.id, order.txId)}
                                className="gap-1"
                              >
                                <Download className="h-3 w-3" />
                                <span className="hidden sm:inline">Invoice</span>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {/* Items */}
                      <div className="mb-4 space-y-3 border-b pb-4">
                        {order.items?.map((item) => (
                          <Link
                            key={item.id}
                            href={`/product/${item.product.slug}`}
                            className="flex items-start justify-between hover:text-purple-600 dark:hover:text-purple-400 transition-colors group"
                          >
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                {item.product.name}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {item.quantity}x {item.size && `${item.size} `}
                                {item.color && `• ${item.color}`}
                              </p>
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                            </p>
                          </Link>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="flex items-center justify-between">
                        <p className="text-slate-600 dark:text-slate-400">Total</p>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                          Rp {order.amount.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  )
                })}
              </div>
            ) : (
              <Empty
                title="No Orders Yet"
                description="Start shopping and your orders will appear here!"
              />
            )}
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Wishlist
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Items you've saved for later
              </p>
            </div>

            {mounted && wishlistItems && wishlistItems.length > 0 ? (
              <div className="space-y-4">
                {wishlistItems.map((item) => (
                  <Card key={item.productId} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 p-4">
                      {/* Image */}
                      <div className="hidden sm:block h-24 w-24 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <span className="text-3xl">
                            {item.category === 'fashion' ? '👗' : '💎'}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.slug}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {item.category === 'fashion' ? '👗 Fashion' : '💎 Jewelry'}
                        </p>
                        <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-2">
                          Rp {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button asChild>
                          <Link href={`/product/${item.slug}`}>
                            <ShoppingBag className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromWishlist(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Empty
                title="Wishlist Empty"
                description="Add items from our collection to your wishlist!"
              />
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Profile Settings
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage your account information
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      First Name
                    </p>
                    <p className="text-slate-900 dark:text-white">
                      {user?.firstName || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Last Name
                    </p>
                    <p className="text-slate-900 dark:text-white">
                      {user?.lastName || '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </p>
                  <p className="text-slate-900 dark:text-white">
                    {user?.emailAddresses[0]?.emailAddress || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Member Since
                  </p>
                  <p className="text-slate-900 dark:text-white">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="w-full gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

'use client'

import { useState, FormEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'
import useSWR from 'swr'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, DollarSign, TrendingUp, Trash2, X, Edit, Bell, LogOut } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAdminStore } from '@/lib/admin-store'

interface Analytics {
  totalProducts: number
  totalProductsSold: number
  totalRevenue: number
  totalOrders: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  category: string
  images: string[]
  sizes: string[]
  colors: string[]
  stock: number
  createdAt: string
  _count?: { orderItems: number }
}

interface Order {
  id: string
  txId: string
  userId: string
  amount: number
  total: number
  status: string
  createdAt: string
  user: { email: string; name?: string | null }
  orderItems: Array<{ quantity: number; price: number; Product: Product }>
}

interface Customer {
  id: string
  email: string
  name: string
  totalOrders: number
  totalSpent: number
  totalItems: number
  lastOrder: string
  createdAt: string
}

interface Coupon {
  id: string
  code: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  maxUses?: number
  usedCount: number
  minPurchase: number
  isActive: boolean
  startDate?: string
  endDate?: string
  createdAt: string
}

interface AdminUser {
  id: string
  email: string
  name: string
  createdAt: string
}

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Webhook {
  id: string
  url: string
  events: string[]
  isActive: boolean
  retryCount: number
  lastTriggeredAt?: string
  successCount: number
  failureCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminPage() {
  const router = useRouter()
  const { admin, logout } = useAdminStore()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [couponCreated, setCouponCreated] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<any>(null)
  const [promotionCreated, setPromotionCreated] = useState(false)
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '',
    minPurchase: '',
    startDate: '',
    endDate: '',
    isActive: true,
  })
  const [promotionForm, setPromotionForm] = useState({
    title: '',
    message: '',
    type: 'promotion',
    image: '',
    link: '',
  })
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    image: '',
  })
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [eventCreated, setEventCreated] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    storeName: 'Fashion Boutique',
    storeEmail: '',
    storePhone: '',
    storeAddress: '',
    paymentFee: '2.5',
  })
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    events: [] as string[],
    isActive: true,
    retryCount: 3,
  })
  const [editingWebhook, setEditingWebhook] = useState<any>(null)
  const [webhookCreated, setWebhookCreated] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category: 'fashion',
    stock: '',
    sizes: '',
    colors: '',
    images: ''
  })

  // Check if user is admin (either via new separate admin system OR via Clerk user with admin role)
  const isAdmin = admin || (user && user.publicMetadata?.role === 'admin')
  const adminName = admin?.name || user?.firstName || 'Admin'

  // API calls - moved before conditional return to maintain hook order
  const { data: analytics, isLoading: analyticsLoading } = useSWR<Analytics>(
    isAdmin && mounted ? '/api/admin/analytics' : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const { data: products, isLoading: productsLoading, mutate: mutateProducts } = useSWR<Product[]>(
    isAdmin && mounted && activeTab === 'products' ? '/api/admin/products' : null,
    fetcher
  )

  const { data: orders } = useSWR<Order[]>(
    isAdmin && mounted && activeTab === 'orders' ? '/api/admin/transactions' : null,
    fetcher
  )

  const { data: customers } = useSWR<Customer[]>(
    isAdmin && mounted && activeTab === 'customers' ? '/api/admin/customers' : null,
    fetcher
  )

  const { data: coupons, mutate: mutateCoupons } = useSWR<Coupon[]>(
    isAdmin && mounted && activeTab === 'coupons' ? '/api/admin/coupons' : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 2000, // Real-time updates every 2 seconds
    }
  )

  interface Promotion {
    id: string
    title: string
    message: string
    type: string
    image: string | null
    link: string | null
    createdAt: string
  }

  const { data: promotions, mutate: mutatePromotions } = useSWR<Promotion[]>(
    isAdmin && mounted && activeTab === 'promotions' ? '/api/admin/promotions' : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 5000, // Real-time updates every 5 seconds
    }
  )

  const { data: events, mutate: mutateEvents } = useSWR<Event[]>(
    isAdmin && mounted && activeTab === 'events' ? '/api/admin/events' : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 5000, // Real-time updates every 5 seconds
    }
  )

  const { data: webhooks, mutate: mutateWebhooks } = useSWR<any[]>(
    isAdmin && mounted && activeTab === 'webhooks' ? '/api/admin/webhooks' : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 5000,
    }
  )

  useEffect(() => {
    setMounted(true)
    // Only redirect if Clerk is loaded AND user is not admin via either method
    if (isLoaded && !admin && (!user || user.publicMetadata?.role !== 'admin')) {
      router.push('/admin-login')
    }
  }, [isLoaded, admin, user, router])

  if (!mounted || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  // If not admin, show error (redirect will happen via useEffect)
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    )
  }

  const handleLogout = async () => {
    if (admin) {
      // Logout from separate admin system
      logout()
      router.push('/admin-login')
    } else if (user) {
      // Logout from Clerk
      await signOut({ redirectUrl: '/' })
    }
  }

  // Webhook Handlers
  const handleCreateWebhook = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(
        editingWebhook ? `/api/admin/webhooks/${editingWebhook.id}` : '/api/admin/webhooks',
        {
          method: editingWebhook ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookForm),
        }
      )
      if (res.ok) {
        setWebhookForm({
          url: '',
          events: [],
          isActive: true,
          retryCount: 3,
        })
        setEditingWebhook(null)
        setWebhookCreated(true)
        setTimeout(() => setWebhookCreated(false), 3000)
        mutateWebhooks()
      }
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      try {
        const res = await fetch(`/api/admin/webhooks/${id}`, { method: 'DELETE' })
        if (res.ok) {
          mutateWebhooks()
        }
      } catch (error) {
        alert(`Error: ${error}`)
      }
    }
  }

  const handleTestWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/webhooks/${id}/test`, { method: 'POST' })
      if (res.ok) {
        alert('Webhook test sent successfully!')
        mutateWebhooks()
      } else {
        alert('Failed to test webhook')
      }
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  const toggleEventSelection = (event: string) => {
    setWebhookForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }))
  }

  // Coupon Handlers
  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(
        editingCoupon
          ? `/api/admin/coupons/${editingCoupon.id}`
          : '/api/admin/coupons',
        {
          method: editingCoupon ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...couponForm,
            createdBy: admin?.email || user?.primaryEmailAddress?.emailAddress,
          }),
        }
      )
      if (res.ok) {
        setCouponForm({
          code: '',
          description: '',
          discountType: 'percentage',
          discountValue: '',
          maxUses: '',
          minPurchase: '',
          startDate: '',
          endDate: '',
          isActive: true,
        })
        setEditingCoupon(null)
        setCouponCreated(true)
        setTimeout(() => setCouponCreated(false), 3000)
        mutateCoupons()
      }
    } catch (err) {
      console.error('Create coupon error:', err)
    }
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setCouponForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      maxUses: coupon.maxUses?.toString() || '',
      minPurchase: coupon.minPurchase.toString(),
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      isActive: coupon.isActive,
    })
  }

  const handleDeleteCoupon = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      if (res.ok) {
        mutateCoupons()
      }
    } catch (err) {
      console.error('Delete coupon error:', err)
    }
  }

  // Promotion Handlers
  const handleCreatePromotion = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionForm),
      })
      if (res.ok) {
        setPromotionForm({
          title: '',
          message: '',
          type: 'promotion',
          image: '',
          link: '',
        })
        setPromotionCreated(true)
        setTimeout(() => setPromotionCreated(false), 3000)
        mutatePromotions()
      }
    } catch (err) {
      console.error('Create promotion error:', err)
    }
  }

  const handleUpdatePromotion = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingPromotion) return
    try {
      const res = await fetch(`/api/admin/promotions/${editingPromotion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionForm),
      })
      if (res.ok) {
        setEditingPromotion(null)
        setPromotionForm({
          title: '',
          message: '',
          type: 'promotion',
          image: '',
          link: '',
        })
        mutatePromotions()
      }
    } catch (err) {
      console.error('Update promotion error:', err)
    }
  }

  const handleDeletePromotion = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        mutatePromotions()
      }
    } catch (err) {
      console.error('Delete promotion error:', err)
    }
  }

  // Event Handlers
  const handleCreateEvent = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': admin?.email || user?.primaryEmailAddress?.emailAddress || ''
        },
        body: JSON.stringify(eventForm),
      })
      if (res.ok) {
        setEventForm({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          location: '',
          image: '',
        })
        setEventCreated(true)
        setTimeout(() => setEventCreated(false), 3000)
        mutateEvents()
      }
    } catch (err) {
      console.error('Create event error:', err)
    }
  }

  const handleUpdateEvent = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingEvent) return
    try {
      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': admin?.email || user?.primaryEmailAddress?.emailAddress || ''
        },
        body: JSON.stringify(eventForm),
      })
      if (res.ok) {
        setEditingEvent(null)
        setEventForm({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          location: '',
          image: '',
        })
        mutateEvents()
      }
    } catch (err) {
      console.error('Update event error:', err)
    }
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      description: event.description,
      startDate: new Date(event.startDate).toISOString().split('T')[0],
      endDate: new Date(event.endDate).toISOString().split('T')[0],
      location: event.location,
      image: event.image || '',
    })
  }

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}`, { 
        method: 'DELETE',
        headers: {
          'x-user-email': admin?.email || user?.primaryEmailAddress?.emailAddress || ''
        }
      })
      if (res.ok) {
        mutateEvents()
      }
    } catch (err) {
      console.error('Delete event error:', err)
    }
  }

  // Settings Handlers
  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault()
    setSettingsSaving(true)
    setSettingsSaved(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      })
      if (res.ok) {
        setSettingsSaved(true)
        setTimeout(() => setSettingsSaved(false), 3000)
      } else {
        alert('Failed to save settings')
      }
    } catch (err) {
      console.error('Save settings error:', err)
      alert('Error saving settings')
    } finally {
      setSettingsSaving(false)
    }
  }

  // Reports Handler
  const handleGenerateReport = async (format: 'json' | 'csv') => {
    try {
      const url = new URL('/api/admin/reports', window.location.origin)
      const res = await fetch(url.toString())
      const data = await res.json()

      if (format === 'csv') {
        const csv = convertToCSV(data)
        const blob = new Blob([csv], { type: 'text/csv' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `sales-report-${new Date().toISOString().split('T')[0]}.json`
        link.click()
      }
    } catch (err) {
      console.error('Generate report error:', err)
      alert('Failed to generate report')
    }
  }

  function convertToCSV(data: any): string {
    let csv = 'Sales Report\n'
    csv += `Generated: ${new Date().toISOString()}\n\n`

    csv += 'SUMMARY STATISTICS\n'
    csv += `Total Orders,Total Revenue,Avg Order,Items Sold\n`
    csv += `${data.stats.totalOrders},${data.stats.totalRevenue},${data.stats.averageOrderValue},${data.stats.totalItems}\n\n`

    csv += 'PRODUCT SALES\n'
    csv += `Product,Quantity,Revenue\n`
    data.productSales.forEach((p: any) => {
      csv += `"${p.productName}",${p.quantity},${p.revenue}\n`
    })
    csv += '\n'

    csv += 'ORDER TRANSACTIONS\n'
    csv += `TxId,Date,Customer,Items,Total,Status\n`
    data.orders.forEach((o: any) => {
      csv += `${o.id},"${o.date}","${o.customerName}",${o.items},${o.total},${o.status}\n`
    })

    return csv
  }

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.slug || !formData.price || !formData.category) {
      alert('Please fill all required fields')
      return
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          price: parseInt(formData.price),
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()) : [],
          colors: formData.colors ? formData.colors.split(',').map(c => c.trim()) : [],
          images: formData.images ? formData.images.split('\n').map(i => i.trim()).filter(Boolean) : []
        })
      })

      if (res.ok) {
        setFormData({ name: '', slug: '', description: '', price: '', category: 'fashion', stock: '', sizes: '', colors: '', images: '' })
        setEditingProduct(null)
        mutateProducts()
        alert('Product added!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert(`Error adding product: ${error}`)
    }
  }

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingProduct || !formData.name || !formData.slug) {
      alert('Please fill all required fields')
      return
    }

    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          price: parseInt(formData.price),
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          sizes: formData.sizes ? formData.sizes.split(',').map(s => s.trim()) : [],
          colors: formData.colors ? formData.colors.split(',').map(c => c.trim()) : [],
          images: formData.images ? formData.images.split('\n').map(i => i.trim()).filter(Boolean) : []
        })
      })

      if (res.ok) {
        setFormData({ name: '', slug: '', description: '', price: '', category: 'fashion', stock: '', sizes: '', colors: '', images: '' })
        setEditingProduct(null)
        mutateProducts()
        alert('Product updated!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert(`Error updating product: ${error}`)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        mutateProducts()
        setShowDeleteConfirm(null)
        alert('Product deleted!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert(`Error deleting product: ${error}`)
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      stock: product.stock.toString(),
      sizes: product.sizes.join(', '),
      colors: product.colors.join(', '),
      images: product.images.join('\n')
    })
  }

  const handleCancelEdit = () => {
    setEditingProduct(null)
    setFormData({ name: '', slug: '', description: '', price: '', category: 'fashion', stock: '', sizes: '', colors: '', images: '' })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      success: 'default',
      pending: 'secondary',
      failed: 'destructive',
      expired: 'destructive',
    }
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
  }

  const getCategoryBadge = (category: string) => {
    return category === 'fashion' ? (
      <Badge className="bg-pink-500">👗 Fashion</Badge>
    ) : (
      <Badge className="bg-yellow-500">💎 Jewelry</Badge>
    )
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>
    if (stock < 5) return <Badge variant="secondary">Low Stock</Badge>
    return <Badge className="bg-green-500">In Stock</Badge>
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">✨ Fashion Boutique Admin</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Welcome, {adminName} {admin ? '(Email Login)' : '(Clerk Login)'} • Manage products, orders, and notifications
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800">
            <a href="/admin/notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Send Notification
            </a>
          </Button>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">👥 Customers</TabsTrigger>
          <TabsTrigger value="promotions">✨ Promotions</TabsTrigger>
          <TabsTrigger value="coupons">🎟️ Coupons</TabsTrigger>
          <TabsTrigger value="events">🎪 Events</TabsTrigger>
          <TabsTrigger value="reports">📊 Reports</TabsTrigger>
          <TabsTrigger value="webhooks">🔗 Webhooks</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : analytics ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalProducts}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
                    <TrendingUp className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalProductsSold}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <Package className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Rp {(analytics.totalRevenue || 0).toLocaleString('id-ID')}</div>
                  </CardContent>
                </Card>
              </div>

              {analytics.monthlyRevenue && analytics.monthlyRevenue.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(v) => `Rp ${(v as number).toLocaleString('id-ID')}`} />
                        <Bar dataKey="revenue" fill="#ec4899" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Product Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Slug *"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Price (Rp) *"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category *</label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fashion">👗 Fashion</SelectItem>
                        <SelectItem value="kalung">💎 Jewelry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    placeholder="Stock"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                  <Input
                    placeholder="Sizes (comma-separated: XS, S, M, L, XL)"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  />
                  <Input
                    placeholder="Colors (comma-separated: Black, White, Red)"
                    value={formData.colors}
                    onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                    className="md:col-span-2"
                  />
                </div>
                <Textarea
                  placeholder="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Textarea
                  placeholder="Images (one URL per line)"
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                  {editingProduct && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : products?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Sold</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{getCategoryBadge(product.category)}</TableCell>
                        <TableCell>Rp {product.price.toLocaleString('id-ID')}</TableCell>
                        <TableCell>{getStockBadge(product.stock)}</TableCell>
                        <TableCell>{product._count?.orderItems || 0}</TableCell>
                        <TableCell>{new Date(product.createdAt).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {showDeleteConfirm === product.id && (
                            <div className="ml-2 flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteProduct(product.id)}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowDeleteConfirm(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>No products</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          {/* Filter and Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter Status</label>
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid ✓</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Stats */}
            {orders && orders.length > 0 && (
              <>
                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales ({orderStatusFilter === 'all' ? 'All' : orderStatusFilter})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {orderStatusFilter === 'all' 
                        ? orders.length 
                        : orders.filter(o => o.status === orderStatusFilter).length}
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue ({orderStatusFilter === 'all' ? 'All' : orderStatusFilter})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      Rp {(orderStatusFilter === 'all' 
                        ? orders.reduce((sum, o) => sum + o.total, 0)
                        : orders.filter(o => o.status === orderStatusFilter).reduce((sum, o) => sum + o.total, 0)).toLocaleString('id-ID')}
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Items Sold ({orderStatusFilter === 'all' ? 'All' : orderStatusFilter})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(orderStatusFilter === 'all' 
                        ? orders.reduce((sum, o) => sum + (o.orderItems?.length || 0), 0)
                        : orders.filter(o => o.status === orderStatusFilter).reduce((sum, o) => sum + (o.orderItems?.length || 0), 0))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Order ({orderStatusFilter === 'all' ? 'All' : orderStatusFilter})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      Rp {Math.round((orderStatusFilter === 'all' 
                        ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length
                        : (orders.filter(o => o.status === orderStatusFilter).length > 0 
                          ? orders.filter(o => o.status === orderStatusFilter).reduce((sum, o) => sum + o.total, 0) / orders.filter(o => o.status === orderStatusFilter).length 
                          : 0))).toLocaleString('id-ID')}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Showing {orderStatusFilter === 'all' ? 'all' : orderStatusFilter} orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!orders?.length ? (
                <p className="text-slate-500">No orders yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Shipping Address</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(orderStatusFilter === 'all' 
                        ? orders 
                        : orders.filter((o: any) => o.status === orderStatusFilter)
                      ).map((order: any) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.txId}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{order.user.name || 'Unknown'}</span>
                              <span className="text-xs text-slate-500">{order.user.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.address ? (
                              <div className="flex flex-col text-xs">
                                <span className="font-medium text-slate-900 dark:text-white">{order.address.fullName}</span>
                                <span className="text-slate-600 dark:text-slate-400">{order.address.address}</span>
                                <span className="text-slate-600 dark:text-slate-400">{order.address.city}, {order.address.province}</span>
                                <span className="text-slate-600 dark:text-slate-400">📞 {order.address.phone}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">No address</span>
                            )}
                          </TableCell>
                          <TableCell>{order.orderItems?.length || 0}</TableCell>
                          <TableCell>Rp {order.amount.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="font-semibold">Rp {order.total.toLocaleString('id-ID')}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell className="text-sm">{new Date(order.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>All customers and their purchase history</CardDescription>
            </CardHeader>
            <CardContent>
              {!customers?.length ? (
                <p className="text-slate-500 text-center py-4">No customers yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Items Purchased</TableHead>
                      <TableHead>Total Spent</TableHead>
                      <TableHead>Last Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-mono text-sm">{customer.email}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.totalOrders}</TableCell>
                        <TableCell>{customer.totalItems}</TableCell>
                        <TableCell className="font-semibold">Rp {customer.totalSpent.toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(customer.lastOrder).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}</CardTitle>
                  <CardDescription>
                    {editingPromotion 
                      ? 'Update promotion details' 
                      : 'Create flash sales, events, or announcements'}
                  </CardDescription>
                </div>
                {editingPromotion && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingPromotion(null)
                      setPromotionForm({
                        title: '',
                        message: '',
                        type: 'promotion',
                        image: '',
                        link: '',
                      })
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={editingPromotion ? handleUpdatePromotion : handleCreatePromotion}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <Input
                    value={promotionForm.title}
                    onChange={(e) =>
                      setPromotionForm({ ...promotionForm, title: e.target.value })
                    }
                    placeholder="e.g., Grand Opening Sale"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <Textarea
                    value={promotionForm.message}
                    onChange={(e) =>
                      setPromotionForm({ ...promotionForm, message: e.target.value })
                    }
                    placeholder="e.g., Get 50% off on selected items"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <Select
                    value={promotionForm.type}
                    onValueChange={(value) =>
                      setPromotionForm({ ...promotionForm, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
                  <Input
                    value={promotionForm.image}
                    onChange={(e) =>
                      setPromotionForm({ ...promotionForm, image: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Link (optional)</label>
                  <Input
                    value={promotionForm.link}
                    onChange={(e) =>
                      setPromotionForm({ ...promotionForm, link: e.target.value })
                    }
                    placeholder="/products or https://example.com"
                  />
                </div>

                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  {editingPromotion ? 'Update Promotion' : 'Create Promotion'}
                </Button>
                {promotionCreated && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ Promotion created successfully!
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Promotions List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Promotions (Real-time)</CardTitle>
              <CardDescription>Manage all promotions</CardDescription>
            </CardHeader>
            <CardContent>
              {!promotions ? (
                <div className="flex justify-center py-12">
                  <Spinner />
                </div>
              ) : promotions.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No promotions yet</p>
              ) : (
                <div className="space-y-4">
                  {promotions.map((promo) => (
                    <div
                      key={promo.id}
                      className="flex items-start justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {promo.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {promo.message}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge
                            className={
                              promo.type === 'promotion'
                                ? 'bg-orange-500'
                                : promo.type === 'event'
                                ? 'bg-blue-500'
                                : 'bg-purple-500'
                            }
                          >
                            {promo.type}
                          </Badge>
                          <Badge variant="outline">
                            {new Date(promo.createdAt).toLocaleDateString('id-ID')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPromotion(promo)
                            setPromotionForm({
                              title: promo.title,
                              message: promo.message,
                              type: promo.type,
                              image: promo.image || '',
                              link: promo.link || '',
                            })
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeletePromotion(promo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</CardTitle>
                  <CardDescription>
                    {editingCoupon
                      ? 'Update coupon details'
                      : 'Add new discount code (updates in real-time every 2 seconds)'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {editingCoupon && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingCoupon(null)
                        setCouponForm({
                          code: '',
                          description: '',
                          discountType: 'percentage',
                          discountValue: '',
                          maxUses: '',
                          minPurchase: '',
                          startDate: '',
                          endDate: '',
                          isActive: true,
                        })
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                  {couponCreated && (
                    <Badge className="bg-green-500 animate-pulse">✓ {editingCoupon ? 'Updated!' : 'Created!'}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCoupon} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Code (e.g., SUMMER2025)"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    required
                    disabled={!!editingCoupon}
                  />
                  <Select value={couponForm.discountType} onValueChange={(v) => setCouponForm({ ...couponForm, discountType: v as 'percentage' | 'fixed' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder={couponForm.discountType === 'percentage' ? 'Discount (%): 20' : 'Discount (Rp): 50000'}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    required
                  />
                  <Input
                    type="number"
                    placeholder="Min Purchase (Rp)"
                    value={couponForm.minPurchase}
                    onChange={(e) => setCouponForm({ ...couponForm, minPurchase: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Max Uses (leave empty for unlimited)"
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={couponForm.startDate}
                    onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={couponForm.endDate}
                    onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })}
                  />
                  <Input
                    placeholder="Description"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    className="md:col-span-2"
                  />
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">Create Coupon</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Coupons</CardTitle>
                  <CardDescription>Total: {coupons?.length || 0} coupons (Real-time: updates every 2 seconds)</CardDescription>
                </div>
                <Badge className="bg-blue-500 animate-pulse">🔄 Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {!coupons?.length ? (
                <p className="text-slate-500 text-center py-4">No coupons created yet</p>
              ) : (
                <div className="space-y-3">
                  {coupons.map(coupon => (
                    <div key={coupon.id} className="flex items-center justify-between rounded-lg border p-4 hover:shadow-md transition-shadow bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-900 dark:to-transparent">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-lg">{coupon.code}</p>
                          <Badge variant="outline" className="text-xs">
                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `Rp ${coupon.discountValue.toLocaleString('id-ID')}`}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {coupon.minPurchase > 0 && `Min Rp ${coupon.minPurchase.toLocaleString('id-ID')} • `}
                          {coupon.maxUses ? `${coupon.usedCount}/${coupon.maxUses} redeemed` : 'Unlimited uses'}
                        </p>
                        {coupon.description && <p className="text-xs text-slate-500 mt-1">{coupon.description}</p>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Badge className={coupon.isActive ? 'bg-green-500 dark:bg-green-600' : 'bg-slate-400'}>
                          {coupon.isActive ? '✓ Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCoupon(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-6">
          {/* Create/Edit Event Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</CardTitle>
                  <CardDescription>
                    {editingEvent ? 'Update event details' : 'Add new event (auto-removes when end date passes)'}
                  </CardDescription>
                </div>
                {editingEvent && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingEvent(null)
                      setEventForm({
                        title: '',
                        description: '',
                        startDate: '',
                        endDate: '',
                        location: '',
                        image: '',
                      })
                    }}
                  >
                    <X className="h-4 w-4" /> Cancel
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Event Title (e.g., Fashion Bazzar 2026)"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Location (e.g., Mall Central, Grand Hall)"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    required
                  />
                </div>
                <Textarea
                  placeholder="Event Description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  required
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Input
                  placeholder="Event Image URL"
                  value={eventForm.image}
                  onChange={(e) => setEventForm({ ...eventForm, image: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </Button>
                  {eventCreated && (
                    <Badge className="bg-green-500 animate-pulse">✓ {editingEvent ? 'Updated!' : 'Created!'}</Badge>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Events List */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Real-time updates every 5 seconds</CardDescription>
            </CardHeader>
            <CardContent>
              {!events ? (
                <Spinner />
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No events yet. Create one to get started!</div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{event.location}</p>
                        </div>
                        <Badge variant={event.isActive ? 'default' : 'outline'}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{event.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Start:</span> {new Date(event.startDate).toLocaleString('id-ID')}
                        </div>
                        <div>
                          <span className="font-medium">End:</span> {new Date(event.endDate).toLocaleString('id-ID')}
                        </div>
                      </div>
                      {event.image && (
                        <img src={event.image} alt={event.title} className="w-full h-32 object-cover rounded" />
                      )}
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Sales Reports</CardTitle>
              <CardDescription>Download complete sales data in JSON or CSV format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={() => handleGenerateReport('json')} className="flex-1 bg-purple-600 hover:bg-purple-700">
                  📥 Download JSON
                </Button>
                <Button onClick={() => handleGenerateReport('csv')} variant="outline" className="flex-1">
                  📥 Download CSV (Excel)
                </Button>
              </div>
              <p className="text-xs text-slate-500">Includes: Summary stats, product sales, daily breakdown, and all transactions</p>
            </CardContent>
          </Card>

          {orders && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rp {orders.reduce((sum, o) => sum + o.total, 0).toLocaleString('id-ID')}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orders.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rp {Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length).toLocaleString('id-ID')}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
              <CardDescription>Manage store information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name</label>
                  <Input
                    placeholder="Fashion Boutique"
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Email</label>
                  <Input
                    type="email"
                    placeholder="info@boutique.com"
                    value={settingsForm.storeEmail}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="+62 812-3456-7890"
                    value={settingsForm.storePhone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storePhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Textarea
                    placeholder="Store address..."
                    value={settingsForm.storeAddress}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeAddress: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Fee (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="2.5"
                    value={settingsForm.paymentFee}
                    onChange={(e) => setSettingsForm({ ...settingsForm, paymentFee: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <Button 
                    type="submit" 
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    disabled={settingsSaving}
                  >
                    {settingsSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                  {settingsSaved && (
                    <div className="text-green-600 dark:text-green-400 text-sm font-medium">
                      ✓ Saved
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Create/Edit Webhook Form */}
            <Card>
              <CardHeader>
                <CardTitle>{editingWebhook ? 'Edit Webhook' : 'Create Webhook'}</CardTitle>
                <CardDescription>
                  {editingWebhook ? 'Update webhook configuration' : 'Add a new webhook for payment gateway integration'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateWebhook} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Webhook URL</label>
                    <Input
                      type="url"
                      placeholder="https://your-server.com/webhooks/payment"
                      value={webhookForm.url}
                      onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-3 block">Events to Listen</label>
                    <div className="space-y-2">
                      {['payment_completed', 'payment_failed', 'order_created', 'order_cancelled'].map(event => (
                        <label key={event} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={webhookForm.events.includes(event)}
                            onChange={() => toggleEventSelection(event)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">{event.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Max Retries</label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={webhookForm.retryCount}
                      onChange={(e) => setWebhookForm({ ...webhookForm, retryCount: parseInt(e.target.value) })}
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={webhookForm.isActive}
                      onChange={(e) => setWebhookForm({ ...webhookForm, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>

                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      {editingWebhook ? 'Update Webhook' : 'Create Webhook'}
                    </Button>
                    {editingWebhook && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setEditingWebhook(null)
                          setWebhookForm({ url: '', events: [], isActive: true, retryCount: 3 })
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>

                  {webhookCreated && (
                    <div className="text-green-600 dark:text-green-400 text-sm font-medium">
                      ✓ {editingWebhook ? 'Updated' : 'Created'} successfully
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Webhooks List */}
            <Card>
              <CardHeader>
                <CardTitle>Active Webhooks</CardTitle>
                <CardDescription>Manage your webhook integrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {!webhooks ? (
                    <Spinner />
                  ) : webhooks.length === 0 ? (
                    <p className="text-sm text-slate-500">No webhooks yet</p>
                  ) : (
                    webhooks.map(webhook => (
                      <div key={webhook.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{webhook.url}</p>
                            <p className="text-xs text-slate-500">
                              {webhook.events.join(', ').replace(/_/g, ' ')}
                            </p>
                          </div>
                          <Badge className={webhook.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingWebhook(webhook)
                              setWebhookForm({
                                url: webhook.url,
                                events: webhook.events,
                                isActive: webhook.isActive,
                                retryCount: webhook.retryCount,
                              })
                            }}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestWebhook(webhook.id)}
                            className="flex-1"
                          >
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            className="flex-1 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-slate-500 pt-2">
                          Success: {webhook.successCount} | Failed: {webhook.failureCount}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
    </main>
  )
}

'use client'

import { useState, FormEvent } from 'react'
import useSWR from 'swr'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, BookOpen, DollarSign, TrendingUp, Trash2, X, Edit } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Analytics {
  totalUsers: number
  totalClasses: number
  totalRevenue: number
  totalTransactions: number
  monthlyRevenue: Array<{ month: string; revenue: number }>
}

interface Kelas {
  id: string
  title: string
  slug: string
  description: string
  price: number
  thumbnail?: string
  groupLink?: string
  createdAt: string
  _count: { transactions: number }
}

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  createdAt: string
  _count: { transactions: number }
}

interface Transaction {
  id: string
  txId: string
  amount: number
  status: string
  paidAt?: string | null
  user: { email: string; name?: string | null }
  kelas: { title: string }
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    groupLink: '',
  })

  // API calls
  const { data: analytics, isLoading: analyticsLoading } = useSWR<Analytics>(
    '/api/admin/analytics',
    fetcher,
    { revalidateOnFocus: false }
  )

  const { data: classes, isLoading: classesLoading, mutate: mutateClasses } = useSWR<Kelas[]>(
    activeTab === 'classes' ? '/api/admin/classes' : null,
    fetcher
  )

  const { data: users, isLoading: usersLoading } = useSWR<User[]>(
    activeTab === 'users' ? '/api/admin/users' : null,
    fetcher
  )

  const { data: transactions, isLoading: transactionsLoading } = useSWR<Transaction[]>(
    activeTab === 'transactions' ? '/api/admin/transactions' : null,
    fetcher
  )

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setThumbnailFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview('')
  }

  const handleAddClass = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.slug || !formData.price) {
      alert('Please fill all required fields')
      return
    }

    setIsCreating(true)
    try {
      let thumbnailUrl = ''

      // Upload thumbnail if selected
      if (thumbnailFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', thumbnailFile)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          thumbnailUrl = uploadData.url
        } else {
          throw new Error('Failed to upload thumbnail')
        }
      }

      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          thumbnail: thumbnailUrl || undefined,
        }),
      })

      if (res.ok) {
        setFormData({ title: '', slug: '', description: '', price: '', groupLink: '' })
        clearThumbnail()
        mutateClasses()
        alert('Class added!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert(`Error adding class: ${error}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Delete this class?')) return

    try {
      const res = await fetch(`/api/admin/classes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        mutateClasses()
        alert('Class deleted!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert(`Error deleting class: ${error}`)
    }
  }

  const handleEditClass = (kelas: Kelas) => {
    setEditingClassId(kelas.id)
    setFormData({
      title: kelas.title,
      slug: kelas.slug,
      description: kelas.description,
      price: kelas.price.toString(),
      groupLink: kelas.groupLink || '',
    })
    setThumbnailPreview(kelas.thumbnail || '')
  }

  const handleUpdateClass = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.slug || !formData.price || !editingClassId) {
      alert('Please fill all required fields')
      return
    }

    setIsEditing(true)
    try {
      let thumbnailUrl = thumbnailPreview

      // Upload new thumbnail if selected
      if (thumbnailFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', thumbnailFile)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          thumbnailUrl = uploadData.url
        } else {
          throw new Error('Failed to upload thumbnail')
        }
      }

      const res = await fetch(`/api/admin/classes/${editingClassId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price),
          thumbnail: thumbnailUrl || null,
        }),
      })

      if (res.ok) {
        setFormData({ title: '', slug: '', description: '', price: '', groupLink: '' })
        clearThumbnail()
        setEditingClassId(null)
        mutateClasses()
        alert('Class updated!')
      } else {
        const error = await res.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert(`Error updating class: ${error}`)
    } finally {
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingClassId(null)
    setFormData({ title: '', slug: '', description: '', price: '', groupLink: '' })
    clearThumbnail()
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

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage classes, users, and view analytics
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {analyticsLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : analytics ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                    <BookOpen className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalClasses}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Rp {analytics.totalRevenue.toLocaleString('id-ID')}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    <TrendingUp className="h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalTransactions}</div>
                  </CardContent>
                </Card>
              </div>

              {analytics.monthlyRevenue.length > 0 && (
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
                        <Tooltip formatter={(v) => `Rp ${v.toLocaleString('id-ID')}`} />
                        <Bar dataKey="revenue" fill="#4f46e5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </TabsContent>

        {/* Classes Tab */}
        <TabsContent value="classes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingClassId ? 'Edit Class' : 'Add Class'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={editingClassId ? handleUpdateClass : handleAddClass} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Title *"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                    <label className="text-sm font-medium">Thumbnail Image</label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                    />
                    {thumbnailPreview && (
                      <div className="relative">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="h-32 w-full rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1"
                          onClick={clearThumbnail}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <Input
                    placeholder="Group Link"
                    value={formData.groupLink}
                    onChange={(e) => setFormData({ ...formData, groupLink: e.target.value })}
                  />
                </div>
                <Textarea
                  placeholder="Description *"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={isCreating || isEditing}>
                    {isCreating || isEditing ? 'Processing...' : editingClassId ? 'Update Class' : 'Add Class'}
                  </Button>
                  {editingClassId && (
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
              <CardTitle>All Classes</CardTitle>
            </CardHeader>
            <CardContent>
              {classesLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : classes?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-medium">{cls.title}</TableCell>
                        <TableCell>Rp {cls.price.toLocaleString('id-ID')}</TableCell>
                        <TableCell>{cls._count.transactions}</TableCell>
                        <TableCell>{new Date(cls.createdAt).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClass(cls)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClass(cls.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>No classes</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : transactions?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TX ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell
 className="font-mono text-sm">{tx.txId}</TableCell>
                        <TableCell>{tx.user.email}</TableCell>
                        <TableCell>{tx.kelas.title}</TableCell>
                        <TableCell>Rp {tx.amount.toLocaleString('id-ID')}</TableCell>
                        <TableCell>{getStatusBadge(tx.status)}</TableCell>
                        <TableCell>
                          {tx.paidAt ? new Date(tx.paidAt).toLocaleDateString('id-ID') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>No transactions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : users?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Purchases</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user._count.transactions}</TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString('id-ID')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p>No users</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

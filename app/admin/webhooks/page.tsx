'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Trash2, Edit, Plus, Copy, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Webhook {
  id: string
  url: string
  events: string[]
  isActive: boolean
  lastTriggeredAt: string | null
  successCount: number
  failureCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface FormData {
  url: string
  events: string[]
  isActive: boolean
  retryCount: number
}

const availableEvents = [
  { id: 'payment_completed', label: '✅ Payment Completed' },
  { id: 'payment_failed', label: '❌ Payment Failed' },
  { id: 'order_created', label: '📦 Order Created' },
  { id: 'order_cancelled', label: '❌ Order Cancelled' },
]

export default function WebhooksPage() {
  const { toast } = useToast()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    url: '',
    events: [],
    isActive: true,
    retryCount: 3,
  })

  // Load webhooks on mount
  useEffect(() => {
    loadWebhooks()
  }, [])

  const loadWebhooks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/webhooks')
      if (res.ok) {
        const data = await res.json()
        setWebhooks(data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load webhooks',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error loading webhooks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load webhooks',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.url.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter webhook URL',
        variant: 'destructive',
      })
      return
    }

    if (formData.events.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one event',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const endpoint = editingId ? `/api/admin/webhooks/${editingId}` : '/api/admin/webhooks'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        await loadWebhooks()
        setIsOpen(false)
        setFormData({ url: '', events: [], isActive: true, retryCount: 3 })
        setEditingId(null)
        toast({
          title: 'Success',
          description: editingId ? 'Webhook updated' : 'Webhook created',
        })
      } else {
        const error = await res.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to save webhook',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving webhook:', error)
      toast({
        title: 'Error',
        description: 'Failed to save webhook',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (webhook: Webhook) => {
    setEditingId(webhook.id)
    setFormData({
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      retryCount: webhook.retryCount || 3,
    })
    setIsOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/webhooks/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await loadWebhooks()
        setDeleteConfirm(null)
        toast({
          title: 'Success',
          description: 'Webhook deleted',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete webhook',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error deleting webhook:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleOpenDialog = () => {
    setEditingId(null)
    setFormData({ url: '', events: [], isActive: true, retryCount: 3 })
    setIsOpen(true)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🪝 Webhooks</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Manage payment gateway integrations and event notifications</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          if (!open) {
            setEditingId(null)
            setFormData({ url: '', events: [], isActive: true, retryCount: 3 })
          }
          setIsOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Webhook' : 'Add New Webhook'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update webhook configuration' : 'Create a new webhook for event notifications'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL *</label>
                <Input
                  type="url"
                  placeholder="https://your-server.com/webhooks/pakasir"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-slate-500 mt-1">HTTPS endpoint that will receive webhook events</p>
              </div>

              {/* Events Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Select Events *</label>
                <div className="space-y-2">
                  {availableEvents.map((event) => (
                    <div key={event.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={event.id}
                        checked={formData.events.includes(event.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              events: [...formData.events, event.id],
                            })
                          } else {
                            setFormData({
                              ...formData,
                              events: formData.events.filter((e) => e !== event.id),
                            })
                          }
                        }}
                        disabled={isSubmitting}
                      />
                      <label htmlFor={event.id} className="text-sm cursor-pointer">
                        {event.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retry Count */}
              <div>
                <label className="block text-sm font-medium mb-2">Max Retries</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.retryCount}
                  onChange={(e) => setFormData({ ...formData, retryCount: parseInt(e.target.value) })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: !!checked })
                  }
                  disabled={isSubmitting}
                />
                <label htmlFor="active" className="text-sm cursor-pointer">
                  Active
                </label>
              </div>

              {/* Save Button */}
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : editingId ? 'Update Webhook' : 'Create Webhook'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Webhooks List */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-slate-500">Loading webhooks...</p>
          </CardContent>
        </Card>
      ) : webhooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium mb-2">No webhooks configured</p>
            <p className="text-sm text-slate-500 mb-4">Create your first webhook to integrate with payment gateways</p>
            <Button onClick={handleOpenDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-mono text-sm break-all">
                        {webhook.url}
                      </CardTitle>
                      <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                        {webhook.isActive ? '✅ Active' : '⏸️ Inactive'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-2">
                      Created by {webhook.createdBy} • {new Date(webhook.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(webhook)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog open={deleteConfirm === webhook.id} onOpenChange={(open) => {
                      setDeleteConfirm(open ? webhook.id : null)
                    }}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The webhook will no longer receive events.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2">
                          <p className="text-sm font-mono break-all bg-slate-100 dark:bg-slate-900 p-2 rounded">
                            {webhook.url}
                          </p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(webhook.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteConfirm(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Events */}
                <div>
                  <p className="text-sm font-medium mb-2">Events Subscribed:</p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => {
                      const eventLabel = availableEvents.find((e) => e.id === event)?.label
                      return (
                        <Badge key={event} variant="outline">
                          {eventLabel || event}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Successful</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {webhook.successCount}
                    </p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Failed</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {webhook.failureCount}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/20 p-3 rounded">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Last Triggered</p>
                    <p className="text-xs font-mono">
                      {webhook.lastTriggeredAt
                        ? new Date(webhook.lastTriggeredAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Documentation Section */}
      <Card>
        <CardHeader>
          <CardTitle>📚 Webhook Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">Webhook Payload Example:</p>
            <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded overflow-x-auto text-xs">
{`{
  "event": "payment_completed",
  "timestamp": "2024-03-17T10:30:00Z",
  "data": {
    "txId": "INV1234567890",
    "orderId": "order-123",
    "amount": 100000,
    "status": "paid",
    "method": "qris"
  }
}`}
            </pre>
          </div>
          <div>
            <p className="font-medium mb-1">Webhook Events:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li><code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">payment_completed</code> - Payment processed successfully</li>
              <li><code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">payment_failed</code> - Payment processing failed</li>
              <li><code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">order_created</code> - New order created</li>
              <li><code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">order_cancelled</code> - Order cancelled</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Best Practices:</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Use HTTPS for all webhook URLs</li>
              <li>Implement retry logic with exponential backoff</li>
              <li>Verify webhook signatures for security</li>
              <li>Log webhook events for debugging</li>
              <li>Respond with 200 OK within 30 seconds</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

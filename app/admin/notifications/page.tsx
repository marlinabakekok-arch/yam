'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function SendNotificationPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [image, setImage] = useState('')
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    error?: string
    sentTo?: number
  } | null>(null)

  if (isLoaded && (!user || (user && !user.unsafeMetadata?.adminRole))) {
    // Check on backend too
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !message) {
      setResult({ error: 'Title and message are required' })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          type,
          image: image || undefined,
          link: link || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          sentTo: data.sentTo,
        })
        // Reset form
        setTitle('')
        setMessage('')
        setType('info')
        setImage('')
        setLink('')
      } else {
        setResult({
          error: data.error || 'Failed to send notification',
        })
      }
    } catch (error) {
      setResult({
        error: 'Failed to send notification',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Send Notification
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Send an announcement to all registered users
          </p>
        </div>

        {/* Result */}
        {result && (
          <Card
            className={`mb-8 ${
              result.success
                ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20'
                : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20'
            }`}
          >
            <CardContent className="pt-6 flex gap-3">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-200">
                      Success!
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Notification sent to {result.sentTo} user{result.sentTo !== 1 ? 's' : ''}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-200">
                      Error
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-300">
                      {result.error}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <CardTitle>Notification Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">
                  Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., New Summer Collection Available"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-700"
                  disabled={loading}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-slate-700 dark:text-slate-300">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Enter your notification message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="dark:bg-slate-900 dark:border-slate-700 resize-none"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {message.length}/500 characters
                </p>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-700 dark:text-slate-300">
                  Type
                </Label>
                <Select value={type} onValueChange={setType} disabled={loading}>
                  <SelectTrigger id="type" className="dark:bg-slate-900 dark:border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">ℹ️ Info</SelectItem>
                    <SelectItem value="promotion">🎉 Promotion</SelectItem>
                    <SelectItem value="alert">⚠️ Alert</SelectItem>
                    <SelectItem value="new_product">✨ New Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-slate-700 dark:text-slate-300">
                  Image URL (optional)
                </Label>
                <Input
                  id="image"
                  placeholder="https://example.com/image.jpg"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  type="url"
                  className="dark:bg-slate-900 dark:border-slate-700"
                  disabled={loading}
                />
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label htmlFor="link" className="text-slate-700 dark:text-slate-300">
                  Link (optional)
                </Label>
                <Input
                  id="link"
                  placeholder="e.g., /products?category=summer"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="dark:bg-slate-900 dark:border-slate-700"
                  disabled={loading}
                />
              </div>

              {/* Preview */}
              {title || message ? (
                <Card className="bg-slate-50 dark:bg-slate-900 border-purple-200 dark:border-purple-900">
                  <CardHeader>
                    <CardTitle className="text-sm">Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {title || 'Notification Title'}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {message || 'Your message will appear here'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant="outline"
                        className={
                          type === 'promotion'
                            ? 'border-orange-300'
                            : type === 'alert'
                            ? 'border-red-300'
                            : type === 'new_product'
                            ? 'border-green-300'
                            : 'border-blue-300'
                        }
                      >
                        {type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !title || !message}
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white h-12"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Sending...' : 'Send Notification to All Users'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

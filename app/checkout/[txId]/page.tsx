'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Clock, CheckCircle, XCircle, ArrowLeft, Trash2, Copy } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useToast } from '@/hooks/use-toast'

interface OrderData {
  txId: string
  amount: number
  total: number
  status: string
  qrString?: string
  payUrl?: string
  expiredAt?: string
  paidAt?: string
  orderItems: Array<{
    quantity: number
    price: number
    Product: { name: string; category: string }
  }>
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ txId: string }>
}) {
  const router = useRouter()
  const { clearCart } = useCart()
  const { toast } = useToast()

  const [txId, setTxId] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [canceling, setCanceling] = useState(false)

  // Resolve params
  useEffect(() => {
    params.then((p) => setTxId(p.txId))
  }, [params])

  // Fetch order details
  useEffect(() => {
    if (!txId) return

    const fetchOrder = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/qris/status/${txId}`)
        if (res.ok) {
          const data = await res.json()
          setOrder(data)

          // Calculate time left
          if (data.expiredAt) {
            const expiry = new Date(data.expiredAt).getTime()
            const now = new Date().getTime()
            const diff = Math.max(0, Math.floor((expiry - now) / 1000))
            setTimeLeft(diff)
          }

          // Clear cart on successful payment
          if (data.status === 'paid') {
            clearCart()
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()

    // Poll for payment status every 5 seconds
    const interval = setInterval(fetchOrder, 5000)
    return () => clearInterval(interval)
  }, [txId, clearCart])

  // Countdown timer
  useEffect(() => {
    if (!order?.expiredAt) return

    const timer = setInterval(() => {
      const expiry = new Date(order.expiredAt!).getTime()
      const now = new Date().getTime()
      const diff = Math.max(0, Math.floor((expiry - now) / 1000))
      setTimeLeft(diff)

      if (diff === 0) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [order?.expiredAt])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return

    setCanceling(true)
    try {
      const res = await fetch(`/api/qris/cancel/${txId}`, { method: 'POST' })
      if (res.ok) {
        toast({
          title: 'Order cancelled',
          description: 'Your order has been cancelled successfully',
        })
        clearCart()
        router.push('/')
      } else {
        toast({
          title: 'Error',
          description: 'Failed to cancel order',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel order',
        variant: 'destructive',
      })
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Spinner />
      </main>
    )
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold">Order not found</h1>
            <Link href="/">
              <Button className="mt-4">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

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
        </div>

        {/* Status Card */}
        <Card className={`mb-8 border-2 ${
          order.status === 'paid'
            ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20'
            : order.status === 'pending'
            ? 'border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/20'
            : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {order.status === 'paid' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-green-900 dark:text-green-200">Payment Successful!</span>
                </>
              ) : order.status === 'pending' ? (
                <>
                  <Clock className="h-6 w-6 text-purple-600" />
                  <span className="text-purple-900 dark:text-purple-200">Waiting for Payment</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="text-red-900 dark:text-red-200">Payment {order.status}</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Order ID</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-mono font-bold text-slate-900 dark:text-white">{order.txId}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.txId)
                    toast({ title: 'Copied!' })
                  }}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className={
                    order.status === 'paid'
                      ? 'bg-green-600'
                      : order.status === 'pending'
                      ? 'bg-purple-600'
                      : 'bg-red-600'
                  }
                >
                  {order.status.toUpperCase()}
                </Badge>
                {order.status === 'pending' && timeLeft > 0 && (
                  <span className="text-sm font-mono text-orange-600 dark:text-orange-400">
                    Expires in: {formatTime(timeLeft)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Amount</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                Rp {order.amount.toLocaleString('id-ID')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        {order.status === 'pending' && (
          <Card className="mb-8 border-purple-200 dark:border-purple-900">
            <CardHeader className="bg-purple-50 dark:bg-purple-950/30">
              <CardTitle className="text-purple-900 dark:text-purple-200">Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  📱 Using QRIS:
                </p>
                <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4 list-decimal">
                  <li>Open your QRIS-compatible payment app</li>
                  <li>Click "Scan QR" and point to the QR code below</li>
                  <li>Confirm the payment amount</li>
                  <li>Complete the transaction</li>
                </ol>
              </div>

              {/* Payment Link Button */}
              <div className="border-t pt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Or use the payment link:
                </p>
                {order.payUrl ? (
                  <a
                    href={order.payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white h-12">
                      Open Payment Link
                    </Button>
                  </a>
                ) : (
                  <Button 
                    disabled 
                    className="w-full bg-slate-400 text-white h-12 cursor-not-allowed"
                  >
                    Payment Link Unavailable
                  </Button>
                )}
              </div>

              {/* QR Code */}
              <div className="border-t pt-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  QR Code:
                </p>
                {order.qrString ? (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {order.qrString.startsWith('http') ? (
                      <img 
                        src={order.qrString} 
                        alt="QRIS QR Code"
                        className="max-w-xs h-auto rounded"
                      />
                    ) : (
                      <img 
                        src={`data:image/png;base64,${order.qrString}`}
                        alt="QRIS QR Code"
                        className="max-w-xs h-auto rounded"
                      />
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-2">📲</div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Loading QR code...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card className="mb-8">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-slate-900 dark:text-white">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {order?.orderItems && order.orderItems.length > 0 ? (
                <>
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm pb-3 border-b border-slate-200 dark:border-slate-800 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{item.Product.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between font-bold text-lg">
                    <span className="text-slate-900 dark:text-white">Total</span>
                    <span className="text-purple-600 dark:text-purple-400">
                      Rp {order.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm">Loading order details...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {order.status === 'paid' ? (
            <Link href="/dashboard" className="w-full">
              <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white h-12">
                View My Orders
              </Button>
            </Link>
          ) : order.status === 'pending' ? (
            <Button
              variant="destructive"
              className="w-full h-12"
              onClick={handleCancel}
              disabled={canceling}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {canceling ? 'Canceling...' : 'Cancel Order'}
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  )
}

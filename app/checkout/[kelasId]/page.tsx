'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useToast } from '@/hooks/use-toast'
import { Copy, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { paymentPoller } from '@/lib/payment-poller'

interface CheckoutPageProps {
  params: Promise<{ kelasId: string }>
}

interface Transaction {
  id: string
  txId: string
  amount: string
  status: string
  qrString: string | null
  expiredAt: string | null
  paidAt: string | null
  kelasTitle: string
}

export default function CheckoutPage({ params }: CheckoutPageProps) {
  const router = useRouter()
  const { userId } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  // Listen for transaction updates
  useEffect(() => {
    const handleTransactionUpdate = (event: CustomEvent) => {
      const { txId, status } = event.detail
      if (transaction && transaction.txId === txId) {
        setTransaction(prev => prev ? { ...prev, status } : null)

        if (status === 'success') {
          toast({
            title: 'Payment Successful!',
            description: 'You now have access to the class.',
          })
          // Redirect to class access page after a short delay
          setTimeout(() => {
            router.push(`/kelas/${transaction.kelasId}/access`)
          }, 2000)
        } else if (status === 'failed') {
          toast({
            title: 'Payment Failed',
            description: 'Please try again or contact support.',
            variant: 'destructive',
          })
        }
      }
    }

    window.addEventListener('transaction-updated', handleTransactionUpdate as EventListener)

    return () => {
      window.removeEventListener('transaction-updated', handleTransactionUpdate as EventListener)
    }
  }, [transaction, toast, router])

  // Periodic status check for UI updates
  useEffect(() => {
    if (!transaction?.txId || transaction.status !== 'pending') return

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/transaction/${transaction.txId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.status !== transaction.status) {
            setTransaction(prev => prev ? { ...prev, status: data.status } : null)
          }
        }
      } catch (error) {
        console.error('Error checking transaction status:', error)
      }
    }

    // Check every 10 seconds for UI updates
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [transaction])

  useEffect(() => {
    const unwrapParams = async () => {
      const { kelasId } = await params
      if (!userId) {
        router.push('/sign-in')
        return
      }

      const createTransaction = async () => {
        try {
          const response = await fetch('/api/qris/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kelasId }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to create transaction')
          }

          setTransaction(data)

          // Start polling for payment status
          if (data.txId) {
            paymentPoller.startPolling(data.txId)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error('[v0] Error creating transaction:', errorMessage)
          toast({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
          })
        } finally {
          setLoading(false)
        }
      }

      createTransaction()
    }

    unwrapParams()
  }, [userId, router, toast, params])

  // Countdown timer
  useEffect(() => {
    if (!transaction?.expiredAt) return

    const timer = setInterval(() => {
      const expiry = new Date(transaction.expiredAt!).getTime()
      const now = new Date().getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setTimeLeft('Expired')
        clearInterval(timer)
        return
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(timer)
  }, [transaction?.expiredAt])

  const handleCheckStatus = async () => {
    if (!transaction) return
    setStatusLoading(true)

    try {
      const response = await fetch(`/api/qris/status/${transaction.txId}`)
      if (!response.ok) throw new Error('Failed to check status')

      const data = await response.json()
      if (data.status === 'success') {
        toast({
          title: 'Payment Successful!',
          description: 'You have been enrolled in the class.',
        })
        router.push('/dashboard')
      } else {
        setTransaction((prev) => prev ? { ...prev, status: data.status } : null)
      }
    } catch (error) {
      console.error('[v0] Error checking status:', error)
      toast({
        title: 'Error',
        description: 'Failed to check payment status.',
        variant: 'destructive',
      })
    } finally {
      setStatusLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!transaction) return
    setCancelLoading(true)

    try {
      const response = await fetch('/api/qris/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: transaction.txId }),
      })

      if (!response.ok) throw new Error('Failed to cancel transaction')

      const data = await response.json()
      setTransaction((prev) => prev ? { ...prev, status: 'cancelled' } : null)
      toast({
        title: 'Transaction Cancelled',
        description: 'Your payment has been cancelled.',
      })
      router.push('/dashboard')
    } catch (error) {
      console.error('[v0] Error cancelling transaction:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel transaction.',
        variant: 'destructive',
      })
    } finally {
      setCancelLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Transaction ID copied to clipboard.',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-12">
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 dark:text-red-400">
                Failed to create transaction. Please try again.
              </p>
              <Button asChild className="mt-4">
                <Link href="/">Back to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Complete Your Purchase
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {transaction.kelasTitle}
            </p>
          </div>

          {/* Status Alert */}
          {transaction.status === 'success' && (
            <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Payment Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 dark:text-green-400">
                  Your enrollment is complete! You can now access the class.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {transaction.status === 'cancelled' && (
            <Card className="border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <AlertCircle className="h-5 w-5" />
                  Payment Cancelled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300">
                  Your payment has been cancelled. You can start a new checkout whenever you're ready.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {transaction.status === 'pending' && (
            <>
              {/* QR Code Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Scan QR Code</CardTitle>
                  <CardDescription>
                    Use your bank app to scan and complete payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {transaction.qrString && (
                    <div className="flex justify-center">
                      <img
                        src={transaction.qrString}
                        alt="QRIS QR Code"
                        className="h-64 w-64 rounded-lg border-2 border-indigo-200 p-4 dark:border-indigo-800"
                      />
                    </div>
                  )}

                  {/* Timer */}
                  {timeLeft && (
                    <div className="flex items-center justify-center gap-2 rounded-lg bg-amber-50 p-4 dark:bg-amber-950">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <span className="font-medium text-amber-900 dark:text-amber-100">
                        Payment expires in: {timeLeft}
                      </span>
                    </div>
                  )}

                  {/* Transaction ID */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Transaction ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={transaction.txId}
                        readOnly
                        className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(transaction.txId)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Amount</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      Rp {parseInt(transaction.amount).toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* Auto Status Check Info */}
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                    <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      🔄 Auto-checking payment status every 30 seconds...
                    </span>
                  </div>

                  {/* Cancel Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      variant="outline"
                      className="w-full max-w-xs"
                    >
                      {cancelLoading ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Payment'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Open your bank's mobile app</li>
                    <li>Look for the "QRIS" or "Scan QR" option</li>
                    <li>Point your camera at the QR code above</li>
                    <li>Review the transaction details and confirm</li>
                    <li>Payment will be automatically detected (no need to click anything!)</li>
                  </ol>
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    💡 The system automatically checks payment status every 30 seconds.
                    You'll be redirected to class access once payment is confirmed.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

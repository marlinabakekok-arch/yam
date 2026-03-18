'use client'

import { useCart } from '@/lib/cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, ShoppingCart, ArrowLeft, Copy, Check, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

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

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  const subtotal = getTotalPrice()
  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === 'percentage'
      ? (subtotal * appliedCoupon.discountValue) / 100
      : appliedCoupon.discountValue
    : 0
  const total = Math.max(0, subtotal - discountAmount)

  // Load addresses from API on mount
  useEffect(() => {
    setMounted(true)
    
    const loadAddresses = async () => {
      try {
        const res = await fetch('/api/dashboard/addresses')
        if (res.ok) {
          const addrs = await res.json()
          setAddresses(addrs)
          // Set default address if available
          const defaultAddr = addrs.find((a: Address) => a.isDefault)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
          } else if (addrs.length > 0) {
            setSelectedAddressId(addrs[0].id)
          }
        } else if (res.status === 401) {
          // User not logged in, try localStorage as fallback
          const saved = localStorage.getItem('user_addresses')
          if (saved) {
            try {
              const addrs = JSON.parse(saved)
              setAddresses(addrs)
              const defaultAddr = addrs.find((a: Address) => a.isDefault)
              if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id)
              } else if (addrs.length > 0) {
                setSelectedAddressId(addrs[0].id)
              }
            } catch (err) {
              console.error('Error parsing localStorage addresses:', err)
            }
          }
        }
      } catch (error) {
        console.error('Error loading addresses:', error)
        // Try localStorage as fallback
        const saved = localStorage.getItem('user_addresses')
        if (saved) {
          try {
            const addrs = JSON.parse(saved)
            setAddresses(addrs)
            const defaultAddr = addrs.find((a: Address) => a.isDefault)
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id)
            } else if (addrs.length > 0) {
              setSelectedAddressId(addrs[0].id)
            }
          } catch (err) {
            console.error('Error parsing localStorage addresses:', err)
          }
        }
      }
    }

    loadAddresses()
  }, [])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }

    setCouponLoading(true)
    setCouponError('')
    
    try {
      const response = await fetch('/api/coupon/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartTotal: subtotal,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAppliedCoupon(data.coupon)
        toast({
          title: 'Success',
          description: `Coupon applied! You save Rp ${data.discountAmount.toLocaleString('id-ID')}`,
        })
        setCouponCode('')
      } else {
        const error = await response.json()
        setCouponError(error.error || 'Invalid coupon code')
      }
    } catch (error) {
      setCouponError('Failed to apply coupon')
      console.error('Coupon error:', error)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      alert('Cart is empty')
      return
    }

    if (!selectedAddressId) {
      toast({
        title: 'Error',
        description: 'Please select a shipping address',
        variant: 'destructive',
      })
      return
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId)
    if (!selectedAddress) {
      toast({
        title: 'Error',
        description: 'Selected address not found',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    try {
      // Create order with all cart items, coupon, and address
      const response = await fetch('/api/qris/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })),
          couponCode: appliedCoupon?.code || null,
          address: selectedAddress,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`Error: ${error.error}`)
        return
      }

      const data = await response.json()
      // Redirect to checkout page with transaction ID
      router.push(`/checkout/${data.txId}`)
    } catch (error) {
      alert(`Error: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🛒 Shopping Cart</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {mounted ? `${getTotalItems()} item${getTotalItems() !== 1 ? 's' : ''} in your cart` : 'Loading...'}
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>

      {/* Cart Content */}
      {!mounted ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-slate-400" />
            <p className="mt-4 text-lg font-medium">Loading cart...</p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-slate-400" />
            <p className="mt-4 text-lg font-medium">Your cart is empty</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Add items from our collection to get started
            </p>
            <Link href="/">
              <Button className="mt-6 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800">
                Start Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Subtotal</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={`${item.productId}-${item.size}-${item.color}-${idx}`}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{item.name}</p>
                            {item.size && (
                              <p className="text-xs text-slate-500">Size: {item.size}</p>
                            )}
                            {item.color && (
                              <p className="text-xs text-slate-500">Color: {item.color}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>Rp {item.price.toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.productId,
                                parseInt(e.target.value),
                                item.size,
                                item.color
                              )
                            }
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.productId, item.size, item.color)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  variant="outline"
                  className="mt-4 text-red-600 hover:bg-red-50"
                  onClick={clearCart}
                >
                  Clear Cart
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Shipping Address Section */}
                <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    📍 Shipping Address
                  </p>
                  {mounted && addresses && addresses.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={selectedAddressId}
                        onChange={(e) => setSelectedAddressId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      >
                        <option value="">Select address...</option>
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.name} • {addr.fullName}
                          </option>
                        ))}
                      </select>
                      {selectedAddressId && (
                        <div className="p-2 bg-white dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          {addresses.find(a => a.id === selectedAddressId) && (
                            <>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {addresses.find(a => a.id === selectedAddressId)?.fullName}
                              </p>
                              <p>{addresses.find(a => a.id === selectedAddressId)?.address}</p>
                              <p>{addresses.find(a => a.id === selectedAddressId)?.city}</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Please add a shipping address in your dashboard first
                    </p>
                  )}
                </div>

                {/* Coupon Section */}
                {!appliedCoupon ? (
                  <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Have a coupon code?
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value)
                          setCouponError('')
                        }}
                        disabled={couponLoading}
                        className="text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                      >
                        {couponLoading ? 'Loading...' : 'Apply'}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{couponError}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-200">
                          {appliedCoupon.code}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveCoupon}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {appliedCoupon.description || 'Discount applied'}
                    </p>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>
                        Discount ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : 'Fixed'})
                      </span>
                      <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 h-12 text-base"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Checkout'}
                </Button>
                <p className="text-xs text-slate-500 text-center">
                  Secure checkout with QRIS payment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  )
}

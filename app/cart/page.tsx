'use client'

import { useCart } from '@/lib/cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Trash2, ShoppingCart, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    if (items.length === 0) {
      alert('Cart is empty')
      return
    }

    setIsProcessing(true)
    try {
      // Create order with all cart items
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
            {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart
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
      {items.length === 0 ? (
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
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
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

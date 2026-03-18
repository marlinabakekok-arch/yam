'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, ShoppingBag } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface FlashSale {
  id: string
  discount: number
  endTime: string
  timeLeft: number
  soldPercentage: number
  product: {
    id: string
    name: string
    price: number
    images: string[]
    stock: number
  }
  originalPrice: number
  discountedPrice: number
  maxQuantity: number | null
}

export function FlashSalesSection() {
  const { data: sales = [] } = useSWR<FlashSale[]>('/api/flash-sales', fetcher, {
    refreshInterval: 5000, // Update every 5 seconds
  })

  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({})

  useEffect(() => {
    const interval = setInterval(() => {
      const newTimes: Record<string, string> = {}

      sales.forEach((sale) => {
        const endTime = new Date(sale.endTime).getTime()
        const now = new Date().getTime()
        const diff = endTime - now

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)

          newTimes[sale.id] = `${hours}h ${minutes}m ${seconds}s`
        } else {
          newTimes[sale.id] = 'Ended'
        }
      })

      setTimeRemaining(newTimes)
    }, 1000)

    return () => clearInterval(interval)
  }, [sales])

  if (!sales || sales.length === 0) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-red-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 rounded-xl">
      <div className="mb-12">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-red-600" />
          <div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
              ⚡ Flash Sales
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Limited time deals up to {Math.max(...sales.map(s => s.discount))}% off
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {sales.slice(0, 3).map((sale) => (
          <Link key={sale.id} href={`/product/${sale.product.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full group">
              {/* Image with discount badge */}
              <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800 h-48">
                {sale.product.images && sale.product.images.length > 0 ? (
                  <img
                    src={sale.product.images[0]}
                    alt={sale.product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">⚡</div>
                )}

                {/* Discount Badge */}
                <Badge className="absolute top-3 right-3 bg-red-600 text-white text-base py-1 px-3 font-bold">
                  -{sale.discount}%
                </Badge>

                {/* Time Left Badge */}
                <Badge className="absolute top-3 left-3 bg-orange-600 text-white text-xs font-semibold">
                  {timeRemaining[sale.id] || 'Loading...'}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-red-600 transition-colors">
                  {sale.product.name}
                </h3>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-600">
                    Rp {sale.discountedPrice.toLocaleString('id-ID')}
                  </span>
                  <span className="text-sm text-slate-500 line-through">
                    Rp {sale.originalPrice.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Progress Bar */}
                {sale.maxQuantity && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span>Sold {sale.soldPercentage}%</span>
                      <span>{sale.maxQuantity - Math.min(sale.sold, sale.maxQuantity)} left</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-300"
                        style={{ width: `${sale.soldPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Button */}
                <Button className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Buy Now
                </Button>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

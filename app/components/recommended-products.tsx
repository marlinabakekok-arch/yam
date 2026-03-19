'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { ShoppingBag, Zap } from 'lucide-react'
import useSWR from 'swr'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
  category: string
  popularity: number
}

export function RecommendedProducts() {
  const { data: recommendations, isLoading } = useSWR<Product[]>(
    '/api/recommendations',
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Update every 10 seconds for real-time trending
    }
  )

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </section>
    )
  }

  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="mb-12">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-orange-500" />
          <div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
              🔥 Trending Now
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Most viewed and purchased items - updated in real-time
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {recommendations.slice(0, 12).map((product) => (
          <Link key={product.id} href={`/product/${product.slug}`}>
            <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col relative">
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-orange-500 hover:bg-orange-600 animate-pulse">
                  🔥 Trending
                </Badge>
              </div>

              <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800 h-64 flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <p className="text-6xl">
                    {product.category === 'fashion' ? '👗' : '💎'}
                  </p>
                )}
              </div>

              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {product.category === 'fashion' ? '👗 Fashion' : '💎 Jewelry'}
                  </Badge>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      Rp {product.price.toLocaleString('id-ID')}
                    </p>
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

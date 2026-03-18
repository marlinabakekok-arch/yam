'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { prisma } from '@/lib/prisma'
import { Search, ShoppingBag, X } from 'lucide-react'
import useSWR from 'swr'
import { Spinner } from '@/components/ui/spinner'

interface Product {
  id: string
  name: string
  description: string
  slug: string
  price: number
  category: string
  stock: number
  images: string[]
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { data: products, isLoading } = useSWR<Product[]>(
    '/api/products',
    fetcher,
    { revalidateOnFocus: false }
  )

  const categories = useMemo(() => {
    if (!products) return []
    return [...new Set(products.map(p => p.category))]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (!products) return []

    return products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = !selectedCategory || product.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            🛍️ Shop All Products
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Discover our complete collection
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="md:col-span-1">
            <div className="space-y-6 sticky top-20">
              {/* Search */}
              <div>
                <label className="text-sm font-semibold text-slate-900 dark:text-white mb-3 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-sm font-semibold text-slate-900 dark:text-white mb-3 block">
                  Category
                </label>
                <div className="space-y-2">
                  <Button
                    onClick={() => setSelectedCategory(null)}
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    className="w-full justify-start"
                    size="sm"
                  >
                    All Products
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      className="w-full justify-start"
                      size="sm"
                    >
                      {category === 'fashion' ? '👗 Fashion' : '💎 Jewelry'}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Active Filters */}
              {(searchQuery || selectedCategory) && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                    Active Filters
                  </p>
                  <div className="space-y-2">
                    {searchQuery && (
                      <Badge
                        variant="secondary"
                        className="flex items-center justify-between w-full cursor-pointer hover:bg-slate-200"
                        onClick={() => setSearchQuery('')}
                      >
                        <span>Search: {searchQuery}</span>
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                    {selectedCategory && (
                      <Badge
                        variant="secondary"
                        className="flex items-center justify-between w-full cursor-pointer hover:bg-slate-200"
                        onClick={() => setSelectedCategory(null)}
                      >
                        <span>
                          {selectedCategory === 'fashion' ? '👗 Fashion' : '💎 Jewelry'}
                        </span>
                        <X className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products Grid */}
          <div className="md:col-span-3">
            {isLoading ? (
              <div className="flex justify-center py-24">
                <Spinner />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No Products Found
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Try adjusting your search or filters
                </p>
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Link key={product.id} href={`/product/${product.slug}`}>
                      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        {/* Image Container */}
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
                          {product.stock <= 5 && product.stock > 0 && (
                            <Badge className="absolute top-4 right-4 bg-orange-500">
                              Only {product.stock} left
                            </Badge>
                          )}
                          {product.stock === 0 && (
                            <Badge variant="destructive" className="absolute top-4 right-4">
                              Out of Stock
                            </Badge>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {product.category === 'fashion' ? '👗 Fashion' : '💎 Jewelry'}
                            </Badge>
                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-2">
                              {product.description}
                            </p>
                          </div>

                          {/* Footer */}
                          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                Rp {product.price.toLocaleString('id-ID')}
                              </p>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800"
                                disabled={product.stock === 0}
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

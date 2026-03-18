import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { ShoppingBag, Truck, RotateCcw, Headphones, Star } from 'lucide-react'
import { RecommendedProducts } from '@/app/components/recommended-products'
import { EventsSection } from '@/app/components/events-section'
import { FlashSalesSection } from '@/app/components/flash-sales'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let products = []
  let dbError = false
  
  try {
    products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
    })
  } catch (error) {
    console.error('[Fashion] Error fetching products:', error)
    dbError = true
  }

  const fashionProducts = products.filter(p => p.category === 'fashion')
  const kalungProducts = products.filter(p => p.category === 'kalung')

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-to-r from-pink-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-200 dark:bg-pink-900 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full blur-3xl opacity-20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="w-full">
            {/* Left Content */}
            <div className="space-y-6 z-10 max-w-2xl">
              <div className="space-y-2">
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                  Fashion & Style
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600">
                    That Stands Out
                  </span>
                </h1>
              </div>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg">
                Discover our exclusive collection of premium fashion items and accessories. Curated for style, crafted for quality.
              </p>
              <div className="flex gap-4">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 text-white">
                  <Link href="#products">
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    Shop Now
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#products">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <Truck className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Free Shipping</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">On orders over Rp 500K</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <RotateCcw className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Easy Returns</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <ShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Secure Checkout</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">QRIS payment secured</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Headphones className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">24/7 Support</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Dedicated customer service</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flash Sales Section */}
      <FlashSalesSection />

      {/* Events Section */}
      <EventsSection />

      {/* Shop All Products Section */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-12">
          <div className="flex items-baseline">
            <ShoppingBag className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
                Shop All Products
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Discover our complete collection
              </p>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950">
            <p className="text-slate-600 dark:text-slate-400">
              {dbError 
                ? 'Database connection unavailable. Check your DATABASE_URL.' 
                : 'No products available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 space-y-6">
                  {/* Search */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Search</h4>
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Categories */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Category</h4>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors text-left">
                        All Products
                      </button>
                      <button className="w-full px-4 py-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2">
                        <span>👗</span> Fashion
                      </button>
                      <button className="w-full px-4 py-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors text-left flex items-center gap-2">
                        <span>💎</span> Jewelry
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Products Grid */}
            <div className="lg:col-span-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Showing {products.length} products</p>
              <div className="grid md:grid-cols-3 gap-6">
                {products.map((product) => (
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
                          <p className="text-6xl">{product.category === 'fashion' ? '👗' : '💎'}</p>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                          <Badge className="absolute top-4 right-4 bg-orange-500 text-white font-semibold">
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
            </div>
          </div>
        )}
      </section>

      {/* Recommended Products Section - Real-time Trending */}
      <RecommendedProducts />

      {/* Why Choose Us Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Why Choose Us?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Trusted by thousands of customers for premium quality fashion and accessories
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: 'Curated Collection',
              description: 'Hand-picked items from the best brands and designers',
            },
            {
              title: 'Premium Quality',
              description: 'We guarantee authentic products with the highest standards',
            },
            {
              title: 'Best Prices',
              description: 'Competitive prices without compromising on quality',
            },
          ].map((item, idx) => (
            <Card key={idx} className="p-8 border-slate-200 dark:border-slate-800">
              <div className="flex justify-center mb-4">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white text-center mb-2">
                {item.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-center">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-700 via-purple-600 to-purple-800 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Start Shopping Today
          </h2>
          <p className="text-lg text-purple-100 dark:text-purple-200 mb-8">
            Join thousands of satisfied customers and find your perfect style
          </p>
          <Button asChild size="lg" className="bg-white text-purple-600 hover:bg-slate-100 dark:bg-slate-100 dark:text-purple-700 dark:hover:bg-white">
            <Link href="#products">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Browse Collection
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

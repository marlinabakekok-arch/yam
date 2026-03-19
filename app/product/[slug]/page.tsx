'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ExternalLink, ShoppingCart, Heart, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useWishlist } from '@/lib/wishlist'
import { Spinner } from '@/components/ui/spinner'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  category: string
  images: string[]
  sizes: string[]
  colors: string[]
  stock: number
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const router = useRouter()
  const { addItem } = useCart()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist()
  
  const [slug, setSlug] = useState<string | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [inWishlist, setInWishlist] = useState(false)

  // Resolve params
  useEffect(() => {
    params.then((p) => setSlug(p.slug))
  }, [params])

  // Fetch product
  useEffect(() => {
    if (!slug) return

    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/${slug}`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data)
          if (data.sizes?.length > 0) setSelectedSize(data.sizes[0])
          if (data.colors?.length > 0) setSelectedColor(data.colors[0])
        } else {
          router.push('/')
        }
      } catch (error) {
        console.error('Failed to fetch product:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug, router])

  // Mount and wishlist check
  useEffect(() => {
    setMounted(true)
    if (product) {
      setInWishlist(isInWishlist(product.id))
    }
  }, [product, isInWishlist])

  const handleAddToCart = async () => {
    if (!product) return

    if (product.sizes?.length > 0 && !selectedSize) {
      alert('Please select a size')
      return
    }
    if (product.colors?.length > 0 && !selectedColor) {
      alert('Please select a color')
      return
    }

    setIsAdding(true)
    try {
      addItem({
        productId: product.id,
        quantity,
        size: selectedSize || undefined,
        color: selectedColor || undefined,
        price: product.price,
        name: product.name,
      })
      
      // Show success and redirect to cart
      alert('Added to cart!')
      router.push('/cart')
    } catch (error) {
      alert(`Error: ${error}`)
    } finally {
      setIsAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <Spinner />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link href="/">
            <Button className="mt-4">Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back Button */}
      <Link href="/">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </Link>

      {/* Header */}
      <div className="mb-8 grid gap-8 md:grid-cols-2">
        {/* Product Image */}
        <div className="space-y-4">
          {product.images && product.images.length > 0 ? (
            <div className="rounded-lg overflow-hidden bg-gradient-to-br from-pink-300 to-purple-400 h-96">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden bg-gradient-to-br from-pink-300 to-purple-400 h-96 flex items-center justify-center">
              <p className="text-6xl">{product.category === 'fashion' ? '👗' : '💎'}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            {product.images &&
              product.images.slice(0, 3).map((img, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden h-20 bg-slate-200">
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge className={`mb-2 ${product.category === 'fashion' ? 'bg-pink-500' : 'bg-yellow-500'}`}>
              {product.category === 'fashion' ? '👗 Fashion' : '💎 Jewelry'}
            </Badge>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
              {product.name}
            </h1>
            <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">
              {product.description}
            </p>
          </div>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold ${
                product.stock > 5
                  ? 'text-green-600'
                  : product.stock > 0
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Price */}
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400">Price</p>
            <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">
              Rp {product.price.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Size *</label>
              <Select value={selectedSize || ''} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {product.sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Color Selector */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Color *</label>
              <Select value={selectedColor || ''} onValueChange={setSelectedColor}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {product.colors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <Input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-24"
            />
          </div>

          {/* Add to Cart Button */}
          <div className="flex gap-4 pt-4">
            <Button
              size="lg"
              className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 h-12 text-white"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isAdding ? 'Adding...' : 'Add to Cart'}
            </Button>
            {mounted && (
              <Button
                size="lg"
                variant={inWishlist ? 'default' : 'outline'}
                className={`h-12 ${inWishlist ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800' : ''}`}
                onClick={() => {
                  if (inWishlist) {
                    removeFromWishlist(product.id)
                  } else {
                    addToWishlist({
                      productId: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      image: product.images?.[0],
                      category: product.category,
                    })
                  }
                  setInWishlist(!inWishlist)
                }}
              >
                <Heart
                  className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`}
                />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Material</p>
              <p className="font-medium">Premium Quality</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Category</p>
              <p className="font-medium capitalize">{product.category}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">SKU</p>
              <p className="font-medium">{product.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping & Returns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Free Shipping</p>
              <p className="font-medium">For orders over Rp 500.000</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Returns</p>
              <p className="font-medium">30-day return policy</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

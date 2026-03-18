'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import useSWR from 'swr'
import { Sparkles, Calendar, Megaphone } from 'lucide-react'

interface Promotion {
  id: string
  title: string
  message: string
  type: 'promotion' | 'event' | 'announcement'
  image: string | null
  link: string | null
  createdAt: string
}

export function PromotionsSection() {
  const { data: promotions, isLoading } = useSWR<Promotion[]>(
    '/api/promotions',
    async (url) => fetch(url).then(r => r.json()),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10000, // Update every 10 seconds
    }
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'promotion':
        return <Sparkles className="h-5 w-5" />
      case 'event':
        return <Calendar className="h-5 w-5" />
      case 'announcement':
        return <Megaphone className="h-5 w-5" />
      default:
        return <Sparkles className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'promotion':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400'
      case 'event':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
      case 'announcement':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/30 dark:text-slate-400'
    }
  }

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </section>
    )
  }

  // Filter out events - only show promotions and announcements
  const filteredPromotions = promotions?.filter(p => p.type !== 'event') || []

  if (!filteredPromotions || filteredPromotions.length === 0) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="mb-12">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-500" />
          <div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
              ✨ Featured Events & Promos
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Don't miss out on exciting exhibitions, sales, and special announcements
            </p>
          </div>
        </div>
      </div>

      {/* Featured (First Item) */}
      {filteredPromotions.length > 0 && (
        <div className="mb-12">
          <Link href={filteredPromotions[0].link || '#'}>
            <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group">
              <div className="md:grid grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 p-8 md:p-10 flex flex-col justify-between min-h-80">
                  <div>
                    <Badge className={getTypeColor(filteredPromotions[0].type)}>
                      {getTypeIcon(filteredPromotions[0].type)}
                      <span className="ml-2">{filteredPromotions[0].type.toUpperCase()}</span>
                    </Badge>
                    <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mt-4 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {filteredPromotions[0].title}
                    </h3>
                  </div>
                  <div>
                    <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
                      {filteredPromotions[0].message}
                    </p>
                    <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800">
                      Learn More →
                    </Button>
                  </div>
                </div>

                {filteredPromotions[0].image && (
                  <div className="hidden md:block h-80 overflow-hidden">
                    <img
                      src={filteredPromotions[0].image}
                      alt={filteredPromotions[0].title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}

                {!filteredPromotions[0].image && (
                  <div className="hidden md:flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                    <Sparkles className="h-24 w-24 text-purple-300" />
                  </div>
                )}
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* Other Promotions Grid */}
      {filteredPromotions.length > 1 && (
        <div className="grid md:grid-cols-3 gap-6">
          {filteredPromotions.slice(1, 4).map((promo) => (
            <Link key={promo.id} href={promo.link || '#'}>
              <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col">
                {promo.image && (
                  <div className="h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={promo.image}
                      alt={promo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                )}

                {!promo.image && (
                  <div className="h-48 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                    {getTypeIcon(promo.type)}
                  </div>
                )}

                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <Badge className={getTypeColor(promo.type)} variant="outline">
                      {promo.type.charAt(0).toUpperCase() + promo.type.slice(1)}
                    </Badge>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                      {promo.title}
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2">
                      {promo.message}
                    </p>
                    <p className="text-xs text-slate-500 mt-3">
                      {new Date(promo.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

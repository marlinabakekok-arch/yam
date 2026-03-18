'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import useSWR from 'swr'
import { Calendar, MapPin, Clock } from 'lucide-react'

interface Event {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  image?: string
  isActive: boolean
  createdAt: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function EventsSection() {
  const { data: events, isLoading } = useSWR<Event[]>(
    '/api/events',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 30000, // Update every 30 seconds
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

  if (!events || events.length === 0) {
    return null
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateShort = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl">
      <div className="mb-12">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
              🎪 Upcoming Events
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Join us at our exciting exhibitions and events
            </p>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card
            key={event.id}
            className="overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full"
          >
            {/* Event Image */}
            <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
              {event.image ? (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
                  <Calendar className="h-16 w-16 text-blue-300 dark:text-blue-600" />
                </div>
              )}
              {/* Active Badge */}
              <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
                Active
              </Badge>
            </div>

            {/* Event Details */}
            <CardHeader className="pb-3">
              <CardTitle className="text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {event.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
              {/* Description */}
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                {event.description}
              </p>

              {/* Location */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-slate-700 dark:text-slate-200 font-medium">{event.location}</p>
              </div>

              {/* Date & Time */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">Start</p>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      {formatDate(event.startDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">End</p>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      {formatDateShort(event.endDate)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

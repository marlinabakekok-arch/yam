import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get notification data to use as promotions/events
    const promotions = await prisma.notification.findMany({
      where: {
        type: { in: ['promotion', 'announcement', 'event'] },
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        image: true,
        link: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // If no promotions, return default ones
    if (promotions.length === 0) {
      return NextResponse.json([
        {
          id: '1',
          title: 'Grand Opening Sale',
          message: 'Flash sale up to 50% off on selected items',
          type: 'promotion',
          image: null,
          link: '#products',
          createdAt: new Date(),
        },
        {
          id: '2',
          title: 'Fashion Exhibition 2026',
          message: 'Join us for the annual fashion showcase',
          type: 'event',
          image: null,
          link: '#products',
          createdAt: new Date(),
        },
        {
          id: '3',
          title: 'New Collection Launch',
          message: 'Summer 2026 collection is now available',
          type: 'announcement',
          image: null,
          link: '#products',
          createdAt: new Date(),
        },
      ])
    }

    return NextResponse.json(promotions)
  } catch (error) {
    console.error('Fetch promotions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const promotion = await prisma.notification.create({
      data: {
        title: body.title,
        message: body.message,
        type: body.type || 'promotion',
        image: body.image,
        link: body.link,
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        image: true,
        link: true,
        createdAt: true,
      },
    })

    return NextResponse.json(promotion, { status: 201 })
  } catch (error) {
    console.error('Create promotion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

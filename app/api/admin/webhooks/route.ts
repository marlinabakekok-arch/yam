import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        lastTriggeredAt: true,
        successCount: true,
        failureCount: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(webhooks)
  } catch (error) {
    console.error('Fetch webhooks error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()

    // Validate URL
    try {
      new URL(body.url)
    } catch {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
    }

    // Validate events
    const validEvents = ['payment_completed', 'payment_failed', 'order_created', 'order_cancelled']
    if (!Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: 'At least one event must be selected' }, { status: 400 })
    }

    const invalidEvents = body.events.filter((e: string) => !validEvents.includes(e))
    if (invalidEvents.length > 0) {
      return NextResponse.json({ error: `Invalid events: ${invalidEvents.join(', ')}` }, { status: 400 })
    }

    // Generate secret
    const secret = crypto.randomBytes(32).toString('hex')

    const webhook = await prisma.webhook.create({
      data: {
        url: body.url.trim(),
        events: body.events,
        secret,
        isActive: body.isActive ?? true,
        retryCount: body.retryCount ?? 3,
        createdBy: user.email,
      },
      select: {
        id: true,
        url: true,
        events: true,
        secret: true,
        isActive: true,
        retryCount: true,
        createdBy: true,
        createdAt: true,
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    console.error('Create webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

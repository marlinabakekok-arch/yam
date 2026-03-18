import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const validEvents = ['payment_completed', 'payment_failed', 'order_created', 'order_cancelled']

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Check webhook exists
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const body = await request.json()

    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url)
      } catch {
        return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
      }
    }

    // Validate events if provided
    if (body.events) {
      if (!Array.isArray(body.events) || body.events.length === 0) {
        return NextResponse.json({ error: 'At least one event must be selected' }, { status: 400 })
      }

      const invalidEvents = body.events.filter((e: string) => !validEvents.includes(e))
      if (invalidEvents.length > 0) {
        return NextResponse.json({ error: `Invalid events: ${invalidEvents.join(', ')}` }, { status: 400 })
      }
    }

    const updated = await prisma.webhook.update({
      where: { id },
      data: {
        url: body.url ? body.url.trim() : undefined,
        events: body.events || undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        retryCount: body.retryCount !== undefined ? body.retryCount : undefined,
      },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        retryCount: true,
        lastTriggeredAt: true,
        successCount: true,
        failureCount: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Check webhook exists
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    await prisma.webhook.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Test webhook endpoint
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    const webhook = await prisma.webhook.findUnique({
      where: { id },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    // Send test payload
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook payload from your payment gateway admin',
      },
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Test': 'true',
        },
        body: JSON.stringify(testPayload),
        timeout: 10000,
      } as any)

      // Update webhook with test result
      await prisma.webhook.update({
        where: { id },
        data: {
          lastTriggeredAt: new Date(),
          successCount: response.ok ? { increment: 1 } : undefined,
          failureCount: !response.ok ? { increment: 1 } : undefined,
        },
      })

      if (response.ok) {
        return NextResponse.json({ success: true, message: 'Webhook test successful' })
      } else {
        return NextResponse.json(
          { success: false, message: `Webhook returned ${response.status}` },
          { status: 400 }
        )
      }
    } catch (error) {
      // Update failure count
      await prisma.webhook.update({
        where: { id },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: { increment: 1 },
        },
      })

      return NextResponse.json(
        { success: false, message: 'Failed to reach webhook endpoint' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

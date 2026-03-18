import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET user notifications
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const notifications = await prisma.userNotification.findMany({
      where: { userId: user.id },
      include: {
        notification: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('[Notifications] Error fetching:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create notification (admin only, sends to all users)
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, type = 'info', image, link } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        image,
        link,
      },
    })

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: { id: true },
    })

    // Create UserNotification for each user
    if (allUsers.length > 0) {
      await prisma.userNotification.createMany({
        data: allUsers.map((u) => ({
          userId: u.id,
          notificationId: notification.id,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json({
      success: true,
      notification,
      sentTo: allUsers.length,
    })
  } catch (error) {
    console.error('[Notifications] Error creating:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

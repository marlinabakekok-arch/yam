import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint can be called by a cron service to auto-delete expired events
export async function POST(req: NextRequest) {
  try {
    // Find and delete events where endDate has passed
    const now = new Date()
    const result = await prisma.event.deleteMany({
      where: {
        endDate: {
          lt: now,
        },
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Deleted ${result.count} expired events`,
    })
  } catch (err) {
    console.error('Auto-delete events error:', err)
    return NextResponse.json(
      { error: 'Failed to auto-delete events' },
      { status: 500 }
    )
  }
}

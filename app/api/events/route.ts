import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/events - Public endpoint to get all active events
export async function GET(req: NextRequest) {
  try {
    const now = new Date()
    
    // Get all active events that haven't ended
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        endDate: {
          gt: now, // endDate must be in the future
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json(events)
  } catch (err) {
    console.error('Get events error:', err)
    return NextResponse.json({ error: 'Failed to get events' }, { status: 500 })
  }
}

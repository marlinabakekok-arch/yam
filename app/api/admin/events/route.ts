import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Check authorization
async function isAdmin(email?: string) {
  if (!email) return false
  const admin = await prisma.admin.findUnique({ where: { email } })
  return !!admin
}

// GET /api/admin/events - List all events
export async function GET(req: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(events)
  } catch (err) {
    console.error('Get events error:', err)
    return NextResponse.json({ error: 'Failed to get events' }, { status: 500 })
  }
}

// POST /api/admin/events - Create new event
export async function POST(req: NextRequest) {
  try {
    const userEmail = req.headers.get('x-user-email')
    if (!userEmail || !(await isAdmin(userEmail))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, startDate, endDate, location, image } = body

    if (!title || !description || !startDate || !endDate || !location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        image: image || null,
        isActive: true,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (err) {
    console.error('Create event error:', err)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Check authorization
async function isAdmin(email?: string) {
  if (!email) return false
  const admin = await prisma.admin.findUnique({ where: { email } })
  return !!admin
}

// PUT /api/admin/events/[id] - Update event
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userEmail = req.headers.get('x-user-email')
    if (!userEmail || !(await isAdmin(userEmail))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, description, startDate, endDate, location, image, isActive } = body

    // Verify event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title: title ?? existingEvent.title,
        description: description ?? existingEvent.description,
        startDate: startDate ? new Date(startDate) : existingEvent.startDate,
        endDate: endDate ? new Date(endDate) : existingEvent.endDate,
        location: location ?? existingEvent.location,
        image: image ?? existingEvent.image,
        isActive: isActive !== undefined ? isActive : existingEvent.isActive,
      },
    })

    return NextResponse.json(updatedEvent)
  } catch (err) {
    console.error('Update event error:', err)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/events/[id] - Delete event
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userEmail = req.headers.get('x-user-email')
    if (!userEmail || !(await isAdmin(userEmail))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete event error:', err)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}

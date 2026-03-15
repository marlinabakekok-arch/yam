import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// DELETE class
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if class exists
    const kelasExists = await prisma.kelas.findUnique({
      where: { id },
    })

    if (!kelasExists) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Delete class (transactions will be deleted due to onDelete: Cascade)
    await prisma.kelas.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Class deleted successfully' })
  } catch (error) {
    console.error('[Admin Classes DELETE Error]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update class
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, slug, description, price, thumbnail, groupLink } = body

    // Check if class exists
    const kelasExists = await prisma.kelas.findUnique({
      where: { id },
    })

    if (!kelasExists) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // If slug is being changed, check if the new slug already exists
    if (slug && slug !== kelasExists.slug) {
      const existingSlug = await prisma.kelas.findUnique({
        where: { slug },
      })
      if (existingSlug) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    const updatedClass = await prisma.kelas.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(price !== undefined && { price }),
        ...(thumbnail !== undefined && { thumbnail: thumbnail || null }),
        ...(groupLink !== undefined && { groupLink: groupLink || null }),
      },
    })

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error('[Admin Classes PUT Error]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

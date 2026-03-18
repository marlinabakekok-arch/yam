import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true, images: true },
        },
      },
      orderBy: { viewedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json(recentlyViewed)
  } catch (error) {
    console.error('Fetch recently viewed error:', error)
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

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()

    const recentlyViewed = await prisma.recentlyViewed.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId: body.productId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: user.id,
        productId: body.productId,
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true, price: true, images: true },
        },
      },
    })

    return NextResponse.json(recentlyViewed, { status: 201 })
  } catch (error) {
    console.error('Track recently viewed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    await prisma.recentlyViewed.delete({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete recently viewed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      return NextResponse.json([])
    }

    // Get all products the user has purchased
    const purchasedProducts = await prisma.orderItem.findMany({
      where: {
        order: {
          userId: user.id,
          status: 'paid',
        },
      },
      include: {
        product: true,
      },
      distinct: ['productId'],
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      purchasedProducts.map((item) => ({
        id: item.product.id,
        product: item.product,
        purchaseDate: item.createdAt,
      }))
    )
  } catch (error) {
    console.error('[Dashboard] Error fetching purchases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


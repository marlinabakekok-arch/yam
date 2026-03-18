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

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: { in: ['paid', 'success'] },
      },
      include: { items: true },
    })

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0

    // Top purchased products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          userId: user.id,
          status: { in: ['paid', 'success'] },
        },
      },
      _sum: {
        quantity: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    })

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, slug: true, images: true },
        })
        return {
          productId: item.productId,
          name: product?.name || 'Unknown',
          slug: product?.slug || '',
          image: product?.images?.[0] || null,
          quantity: item._sum.quantity || 0,
        }
      })
    )

    return NextResponse.json({
      totalSpent,
      totalOrders,
      averageOrderValue,
      topProducts: topProductsWithDetails,
    })
  } catch (error) {
    console.error('Statistics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

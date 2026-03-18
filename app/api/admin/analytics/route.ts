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

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total users
    const totalUsers = await prisma.user.count()

    // Get total products
    const totalProducts = await prisma.product.count()

    // Get total orders (only paid, exclude expired)
    const now = new Date()
    const totalOrders = await prisma.order.count({
      where: { 
        status: 'paid',
        // Exclude if expiredAt has passed
        OR: [
          { expiredAt: null },
          { expiredAt: { gt: now } }
        ]
      },
    })

    // Get total revenue (only paid, exclude expired)
    const revenueResult = await prisma.order.aggregate({
      where: { 
        status: 'paid',
        OR: [
          { expiredAt: null },
          { expiredAt: { gt: now } }
        ]
      },
      _sum: { amount: true },
    })

    const totalRevenue = revenueResult._sum.amount
      ? parseInt(revenueResult._sum.amount)
      : 0

    // Get monthly revenue (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyOrders = await prisma.order.findMany({
      where: {
        status: 'paid',
        paidAt: {
          gte: sixMonthsAgo,
        },
        // Exclude expired orders
        OR: [
          { expiredAt: null },
          { expiredAt: { gt: now } }
        ]
      },
      select: {
        paidAt: true,
        amount: true,
      },
    })

    // Group by month
    const monthlyRevenue: Record<string, number> = {}
    monthlyOrders.forEach((order) => {
      if (order.paidAt) {
        const date = new Date(order.paidAt)
        const monthKey = date.toLocaleDateString('id-ID', {
          month: 'short',
          year: 'numeric',
        })
        monthlyRevenue[monthKey] =
          (monthlyRevenue[monthKey] || 0) + parseInt(order.amount)
      }
    })

    // Get total products sold (only from paid orders)
    const itemsSoldResult = await prisma.orderItem.aggregate({
      where: {
        order: {
          status: 'paid',
          // Exclude expired orders
          OR: [
            { expiredAt: null },
            { expiredAt: { gt: now } }
          ]
        }
      },
      _sum: { quantity: true },
    })
    const totalProductsSold = itemsSoldResult._sum.quantity || 0

    // Convert to array format for chart
    const monthlyRevenueArray = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({
        month,
        revenue,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.month)
        const dateB = new Date(b.month)
        return dateA.getTime() - dateB.getTime()
      })
      .slice(-6) // Last 6 months

    return NextResponse.json({
      totalUsers,
      totalProducts,
      totalRevenue,
      totalOrders,
      totalProductsSold,
      monthlyRevenue: monthlyRevenueArray,
    })
  } catch (error) {
    console.error('[v0] Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

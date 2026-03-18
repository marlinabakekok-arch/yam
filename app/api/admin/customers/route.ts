import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET all customers with their order statistics
export async function GET() {
  try {
    const customers = await prisma.user.findMany({
      where: {
        orders: {
          some: {}, // only users who have made orders
        },
      },
      include: {
        orders: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Enrich with stats
    const customersWithStats = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0)
      const totalOrders = customer.orders.length
      const totalItems = customer.orders.reduce((sum, order) => sum + order.items.length, 0)

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name || 'Unknown',
        totalOrders,
        totalSpent,
        totalItems,
        lastOrder: customer.orders[0]?.createdAt,
        createdAt: customer.createdAt,
        orders: customer.orders,
      }
    })

    return NextResponse.json(customersWithStats)
  } catch (error) {
    console.error('[Customers] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

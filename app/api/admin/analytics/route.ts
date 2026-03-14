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

    // Get total classes
    const totalClasses = await prisma.kelas.count()

    // Get total transactions
    const totalTransactions = await prisma.transaction.count({
      where: { status: 'success' },
    })

    // Get total revenue
    const revenueResult = await prisma.transaction.aggregate({
      where: { status: 'success' },
      _sum: { amount: true },
    })

    const totalRevenue = revenueResult._sum.amount
      ? parseInt(revenueResult._sum.amount)
      : 0

    // Get monthly revenue (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        status: 'success',
        paidAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        paidAt: true,
        amount: true,
      },
    })

    // Group by month
    const monthlyRevenue: Record<string, number> = {}
    monthlyTransactions.forEach((tx) => {
      if (tx.paidAt) {
        const date = new Date(tx.paidAt)
        const monthKey = date.toLocaleDateString('id-ID', {
          month: 'short',
          year: 'numeric',
        })
        monthlyRevenue[monthKey] =
          (monthlyRevenue[monthKey] || 0) + parseInt(tx.amount)
      }
    })

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
      totalClasses,
      totalRevenue,
      totalTransactions,
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

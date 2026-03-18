import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET sales reports and statistics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json or csv
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Get all orders with filters
    const orders = await prisma.order.findMany({
      where: {
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate stats
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: Math.round(
        orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0
      ),
      ordersByStatus: {
        pending: orders.filter(o => o.status === 'pending').length,
        paid: orders.filter(o => o.status === 'paid').length,
        failed: orders.filter(o => o.status === 'failed').length,
        expired: orders.filter(o => o.status === 'expired').length,
      },
      totalItems: orders.reduce((sum, o) => sum + o.items.length, 0),
    }

    // Group by product
    const productSales = new Map()
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!productSales.has(item.productId)) {
          productSales.set(item.productId, {
            productId: item.productId,
            productName: item.product.name,
            quantity: 0,
            revenue: 0,
          })
        }
        const current = productSales.get(item.productId)
        current.quantity += item.quantity
        current.revenue += item.price * item.quantity
      })
    })

    // Group by day
    const dailySales = new Map()
    orders.forEach(order => {
      const day = new Date(order.createdAt).toISOString().split('T')[0]
      if (!dailySales.has(day)) {
        dailySales.set(day, {
          date: day,
          orders: 0,
          revenue: 0,
        })
      }
      const current = dailySales.get(day)
      current.orders += 1
      current.revenue += order.total
    })

    const report = {
      generatedAt: new Date(),
      period: {
        startDate: startDate || 'N/A',
        endDate: endDate || 'N/A',
      },
      stats,
      productSales: Array.from(productSales.values()),
      dailySales: Array.from(dailySales.values()).sort((a, b) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      orders: orders.map(o => ({
        id: o.txId,
        date: o.createdAt,
        customer: o.user.email,
        customerName: o.user.name || 'Unknown',
        items: o.items.length,
        amount: o.amount,
        total: o.total,
        status: o.status,
      })),
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(report)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="sales-report.csv"',
        },
      })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('[Reports] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

function convertToCSV(report: any): string {
  let csv = 'Sales Report\n'
  csv += `Generated: ${report.generatedAt}\n`
  csv += `Period: ${report.period.startDate} to ${report.period.endDate}\n\n`

  csv += 'SUMMARY STATISTICS\n'
  csv += `Total Orders,Total Revenue,Avg Order,Items Sold\n`
  csv += `${report.stats.totalOrders},Rp ${report.stats.totalRevenue},Rp ${report.stats.averageOrderValue},${report.stats.totalItems}\n\n`

  csv += 'PRODUCT SALES\n'
  csv += `Product,Quantity,Revenue\n`
  report.productSales.forEach((p: any) => {
    csv += `"${p.productName}",${p.quantity},Rp ${p.revenue}\n`
  })
  csv += '\n'

  csv += 'DAILY SALES\n'
  csv += `Date,Orders,Revenue\n`
  report.dailySales.forEach((d: any) => {
    csv += `${d.date},${d.orders},Rp ${d.revenue}\n`
  })
  csv += '\n'

  csv += 'ORDER TRANSACTIONS\n'
  csv += `Transaction ID,Date,Customer,Items,Amount,Total,Status\n`
  report.orders.forEach((o: any) => {
    csv += `${o.id},"${o.date}","${o.customerName} (${o.customer})",${o.items},Rp ${o.amount},Rp ${o.total},${o.status}\n`
  })

  return csv
}

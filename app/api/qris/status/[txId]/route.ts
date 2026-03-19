import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ txId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { txId } = await params

    // Get order
    const order = await prisma.order.findUnique({
      where: { txId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify user owns this order
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || order.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check payment status with PayDigital
    let paymentStatus = order.status
    try {
      const paydigitalResponse = await fetch(
        `https://api.paydigital.id/v1/qris/${txId}/status`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYDIGITAL_API_KEY}`,
          },
        }
      )

      if (paydigitalResponse.ok) {
        const paydigitalData = await paydigitalResponse.json()
        paymentStatus = paydigitalData.status?.toLowerCase() || 'pending'

        // Update order if payment successful
        if (paymentStatus === 'success' || paymentStatus === 'paid') {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'paid',
              paidAt: new Date(),
            },
          })
        }
      }
    } catch (error) {
      console.error('[QRIS] PayDigital status check error:', error)
      // Return current status from database if API fails
    }

    return NextResponse.json({
      txId: order.txId,
      status: paymentStatus,
      amount: order.amount,
      total: order.amount,
      qrString: order.qrString,
      payUrl: order.payUrl,
      expiredAt: order.expiredAt,
      paidAt: order.paidAt,
      orderItems: order.items.map((item) => ({
        quantity: item.quantity,
        price: item.price,
        Product: {
          name: item.product.name,
          category: item.product.category,
        },
      })),
    })
  } catch (error) {
    console.error('[QRIS] Error checking order status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

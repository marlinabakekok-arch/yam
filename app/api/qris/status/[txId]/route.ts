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

    // Check payment status with Pakasir
    let paymentStatus = order.status
    
    // Auto-expire if order is pending and past expiration time
    const now = new Date()
    if (order.status === 'pending' && order.expiredAt && order.expiredAt < now) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'expired' },
      })
      paymentStatus = 'expired'
    } else {
      try {
        if (!process.env.PAKASIR_PROJECT || !process.env.PAKASIR_API_KEY) {
          console.error('[Pakasir] Missing configuration')
          return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
        }

        const pakasirResponse = await fetch(
          `https://app.pakasir.com/api/transactiondetail?project=${process.env.PAKASIR_PROJECT}&amount=${order.amount}&order_id=${txId}&api_key=${process.env.PAKASIR_API_KEY}`
        )

        if (pakasirResponse.ok) {
          const pakasirData = await pakasirResponse.json()
          const transaction = pakasirData.transaction
          paymentStatus = transaction.status === 'completed' ? 'paid' : transaction.status || 'pending'

          // Update order if payment successful
          if (paymentStatus === 'paid' && order.status !== 'paid') {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                status: 'paid',
                paidAt: new Date(transaction.completed_at || new Date()),
              },
            })
          }
        }
      } catch (error) {
        console.error('[Pakasir] Status check error:', error)
        // Return current status from database if API fails
      }
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

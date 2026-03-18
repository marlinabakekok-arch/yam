import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
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

    // Don't allow cancelling paid orders
    if (order.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot cancel paid orders' },
        { status: 400 }
      )
    }

    // Cancel with Pakasir API
    try {
      if (!process.env.PAKASIR_PROJECT || !process.env.PAKASIR_API_KEY) {
        console.error('[Pakasir] Missing configuration')
        return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
      }

      const cancelResponse = await fetch(
        'https://app.pakasir.com/api/transactioncancel',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project: process.env.PAKASIR_PROJECT,
            order_id: txId,
            amount: order.amount,
            api_key: process.env.PAKASIR_API_KEY,
          }),
        }
      )

      if (!cancelResponse.ok) {
        const errorText = await cancelResponse.text()
        console.error('[Pakasir] Cancel API error:', errorText)
        // Still cancel locally even if Pakasir cancel fails
      }
    } catch (error) {
      console.error('[Pakasir] Cancel API call error:', error)
      // Still cancel locally even if API fails
    }

    // Update order status to cancelled
    const cancelledOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      order: cancelledOrder,
    })
  } catch (error) {
    console.error('[Cancel Order] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


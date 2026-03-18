import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { txId } = await request.json()
    if (!txId) {
      return NextResponse.json({ error: 'Missing txId' }, { status: 400 })
    }

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

    // Can only cancel pending orders
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot cancel non-pending order' },
        { status: 400 }
      )
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'cancelled',
      },
    })

    return NextResponse.json({
      txId: updatedOrder.txId,
      status: updatedOrder.status,
    })
  } catch (error) {
    console.error('[QRIS] Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

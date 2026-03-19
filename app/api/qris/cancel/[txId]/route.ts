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

    // Delete order items
    await prisma.orderItem.deleteMany({
      where: { orderId: order.id },
    })

    // Delete order
    await prisma.order.delete({
      where: { id: order.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
    })
  } catch (error) {
    console.error('[Cancel Order] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

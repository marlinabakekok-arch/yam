import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Pakasir Webhook Handler
 * Receives payment notifications from Pakasir when payment is completed
 * 
 * Expected body from Pakasir:
 * {
 *   "amount": 22000,
 *   "order_id": "240910HDE7C9",
 *   "project": "depodomain",
 *   "status": "completed",
 *   "payment_method": "qris",
 *   "completed_at": "2024-09-10T08:07:02.819+07:00"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, order_id, project, status, payment_method, completed_at } = body

    console.log('[Pakasir Webhook] Received:', { order_id, amount, status, payment_method })

    // Verify this is from the correct project
    if (project !== process.env.PAKASIR_PROJECT) {
      console.warn('[Pakasir Webhook] Project mismatch:', { expected: process.env.PAKASIR_PROJECT, received: project })
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 })
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { txId: order_id },
    })

    if (!order) {
      console.warn('[Pakasir Webhook] Order not found:', order_id)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify amount matches (important for security)
    if (order.amount !== amount) {
      console.error('[Pakasir Webhook] Amount mismatch:', { expected: order.amount, received: amount })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // Update order status based on payment status
    if (status === 'completed') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paidAt: new Date(completed_at || new Date()),
        },
      })

      console.log('[Pakasir Webhook] Order marked as paid:', order_id)

      // You can add additional logic here:
      // - Send confirmation email
      // - Update inventory
      // - Trigger fulfillment
      // - Send notification to user
    } else if (status === 'failed' || status === 'cancelled') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'failed' },
      })

      console.log('[Pakasir Webhook] Order marked as failed:', order_id)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true, received: true })
  } catch (error) {
    console.error('[Pakasir Webhook] Error:', error)
    // Still return 200 to prevent Pakasir from retrying
    return NextResponse.json({ success: false, error: 'Processing failed' }, { status: 200 })
  }
}

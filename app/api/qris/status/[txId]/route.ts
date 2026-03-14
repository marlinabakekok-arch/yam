import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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

    // Get transaction
    const transaction = await prisma.transaction.findUnique({
      where: { txId },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user owns this transaction
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || transaction.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check payment status with PayDigital
    let paymentStatus = transaction.status
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

        // Update transaction if payment successful
        if (paymentStatus === 'success' || paymentStatus === 'paid') {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'success',
              paidAt: new Date(),
            },
          })
        }
      }
    } catch (error) {
      console.error('[v0] PayDigital status check error:', error)
      // Return current status from database if API fails
    }

    return NextResponse.json({
      txId: transaction.txId,
      status: paymentStatus,
      amount: transaction.amount,
      expiredAt: transaction.expiredAt,
      paidAt: transaction.paidAt,
    })
  } catch (error) {
    console.error('[v0] Error checking transaction status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

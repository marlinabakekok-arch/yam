import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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

    // Can only cancel pending transactions
    if (transaction.status !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot cancel non-pending transaction' },
        { status: 400 }
      )
    }

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'cancelled',
      },
    })

    return NextResponse.json({
      txId: updatedTransaction.txId,
      status: updatedTransaction.status,
    })
  } catch (error) {
    console.error('[v0] Error cancelling transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

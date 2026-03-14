import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { kelasId } = await request.json()
    if (!kelasId) {
      return NextResponse.json({ error: 'Missing kelasId' }, { status: 400 })
    }

    // Get the class
    const kelas = await prisma.kelas.findUnique({
      where: { id: kelasId },
    })

    if (!kelas) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Get or create user in database with placeholder email
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { 
        clerkId: userId,
        email: `user_${userId}@placeholder.local`,
      },
    })

    // Check if already enrolled
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        kelasId: kelas.id,
        status: 'success',
      },
    })

    if (existingTransaction) {
      return NextResponse.json(
        { error: 'Already enrolled in this class' },
        { status: 400 }
      )
    }

    // Create transaction ID
    const txId = `TX${Date.now()}${Math.random().toString(36).substr(2, 9)}`

    // Generate QR code URL using QR code service
    const qrData = JSON.stringify({ txId, kelas: kelas.title, amount: kelas.price })
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`

    // Create transaction in database
    const transaction = await prisma.transaction.create({
      data: {
        txId,
        userId: user.id,
        kelasId: kelas.id,
        amount: kelas.price,
        total: kelas.price,
        status: 'pending',
        qrString: qrCodeUrl,
        payUrl: null,
        expiredAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      },
    })

    return NextResponse.json({
      id: transaction.id,
      txId: transaction.txId,
      amount: transaction.amount,
      status: transaction.status,
      qrString: transaction.qrString,
      payUrl: transaction.payUrl,
      expiredAt: transaction.expiredAt,
      paidAt: transaction.paidAt,
      kelasTitle: kelas.title,
    })
  } catch (error) {
    console.error('[v0] Error creating QRIS transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

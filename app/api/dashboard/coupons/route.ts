import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const now = new Date()

    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gt: now } }
        ],
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } }
            ]
          }
        ]
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        minPurchase: true,
        maxUses: true,
        usedCount: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(coupons)
  } catch (error) {
    console.error('Fetch coupons error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

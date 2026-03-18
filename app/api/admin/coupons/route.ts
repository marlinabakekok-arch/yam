import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET all coupons
export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(coupons)
  } catch (error) {
    console.error('[Coupons GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    )
  }
}

// POST create new coupon
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      code,
      description,
      discountType,
      discountValue,
      maxUses,
      minPurchase,
      isActive,
      startDate,
      endDate,
      createdBy,
    } = body

    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: 'Code, discountType, and discountValue are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 409 }
      )
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseInt(discountValue),
        maxUses: maxUses ? parseInt(maxUses) : null,
        minPurchase: minPurchase ? parseInt(minPurchase) : 0,
        isActive,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy: createdBy || 'admin',
      },
    })

    return NextResponse.json(
      { success: true, coupon },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Coupons POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    )
  }
}

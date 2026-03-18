import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { code, cartTotal } = await request.json()

    if (!code || !cartTotal) {
      return NextResponse.json(
        { error: 'Code and total are required' },
        { status: 400 }
      )
    }

    // Find coupon by code (case-insensitive)
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: {
          equals: code.toUpperCase(),
          mode: 'insensitive',
        },
      },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon code not found' },
        { status: 404 }
      )
    }

    // Check if coupon has reached max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: 'This coupon has reached its usage limit' },
        { status: 400 }
      )
    }

    // Check minimum purchase amount
    if (cartTotal < coupon.minPurchase) {
      return NextResponse.json(
        {
          error: `Minimum purchase Rp ${coupon.minPurchase.toLocaleString('id-ID')} required for this coupon`,
        },
        { status: 400 }
      )
    }

    // Calculate discount amount
    const discountAmount = 
      coupon.discountType === 'percentage'
        ? (cartTotal * coupon.discountValue) / 100
        : coupon.discountValue

    return NextResponse.json({
      coupon,
      discountAmount,
      message: 'Coupon applied successfully',
    })
  } catch (error) {
    console.error('[Coupon Validate] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

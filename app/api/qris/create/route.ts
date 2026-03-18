import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface OrderItem {
  productId: string
  quantity: number
  size?: string
  color?: string
}

interface ShippingAddress {
  id?: string
  name?: string
  fullName: string
  phone: string
  address: string
  city: string
  province: string
  postalCode: string
  isDefault?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, couponCode, address } = body // items: [{productId, quantity, size, color}, ...], address: {fullName, phone, address, city, province, postalCode, ...}

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing items' }, { status: 400 })
    }

    if (!address) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
    }

    // Get or create user in database
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: { 
        clerkId: userId,
        email: `user_${userId}@placeholder.local`,
      },
    })

    // Create or update address in database
    let addressRecord: any
    if (address.id && address.id.startsWith(address.fullName)) {
      // This is a localStorage ID, create new address
      addressRecord = await prisma.address.create({
        data: {
          userId: user.id,
          name: address.name || 'Shipping Address',
          fullName: address.fullName,
          phone: address.phone,
          address: address.address,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          isDefault: address.isDefault || false,
        },
      })
    } else {
      // Try to find existing address by ID
      const existingAddress = await prisma.address.findUnique({
        where: { id: address.id },
      })
      
      if (existingAddress && existingAddress.userId === user.id) {
        addressRecord = existingAddress
      } else {
        // Create new address
        addressRecord = await prisma.address.create({
          data: {
            userId: user.id,
            name: address.name || 'Shipping Address',
            fullName: address.fullName,
            phone: address.phone,
            address: address.address,
            city: address.city,
            province: address.province,
            postalCode: address.postalCode,
            isDefault: address.isDefault || false,
          },
        })
      }
    }

    // Validate products and calculate total
    let totalAmount = 0
    const productDetails = []

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        )
      }

      totalAmount += product.price * item.quantity
      productDetails.push({
        name: product.name,
        quantity: item.quantity,
        price: product.price,
      })
    }

    // Validate and apply coupon if provided
    let coupon = null
    let discountAmount = 0
    if (couponCode) {
      coupon = await prisma.coupon.findFirst({
        where: {
          code: {
            equals: couponCode.toUpperCase(),
            mode: 'insensitive',
          },
        },
      })

      if (coupon) {
        // Check if coupon is still valid
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          return NextResponse.json(
            { error: 'This coupon has reached its usage limit' },
            { status: 400 }
          )
        }

        // Check minimum purchase
        if (totalAmount < coupon.minPurchase) {
          return NextResponse.json(
            {
              error: `Minimum purchase Rp ${coupon.minPurchase.toLocaleString('id-ID')} required for this coupon`,
            },
            { status: 400 }
          )
        }

        // Calculate discount
        discountAmount = coupon.discountType === 'percentage'
          ? (totalAmount * coupon.discountValue) / 100
          : coupon.discountValue
      } else {
        // Invalid coupon code
        return NextResponse.json(
          { error: 'Invalid coupon code' },
          { status: 400 }
        )
      }
    }

    // Apply discount
    const finalAmount = Math.max(0, totalAmount - discountAmount)

    // Create order ID (matching Pakasir format)
    const txId = `INV${Date.now()}`

    // Create QRIS via Pakasir API
    let qrString = ''
    let payUrl = ''
    let totalWithFee = finalAmount
    let expiredAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour default

    if (!process.env.PAKASIR_PROJECT || !process.env.PAKASIR_API_KEY) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    try {
      const pakasirResponse = await fetch(
        'https://app.pakasir.com/api/transactioncreate/qris',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            project: process.env.PAKASIR_PROJECT,
            order_id: txId,
            amount: Math.round(finalAmount),
            api_key: process.env.PAKASIR_API_KEY,
          }),
        }
      )

      if (pakasirResponse.ok) {
        const pakasirData = await pakasirResponse.json()
        const payment = pakasirData.payment
        
        qrString = payment.payment_number || ''
        payUrl = `https://app.pakasir.com/pay/${process.env.PAKASIR_PROJECT}/${Math.round(finalAmount)}?order_id=${txId}`
        totalWithFee = payment.total_payment || finalAmount
        expiredAt = new Date(payment.expired_at || Date.now() + 60 * 60 * 1000)
        
        console.log('[Pakasir] Payment created:', { txId, amount: finalAmount, total_payment: totalWithFee })
      } else {
        const errorText = await pakasirResponse.text()
        console.error('[Pakasir] API error:', errorText)
        return NextResponse.json(
          { error: 'Failed to create payment' },
          { status: 500 }
        )
      }
    } catch (error) {
      console.error('[Pakasir] API call error:', error)
      return NextResponse.json(
        { error: 'Payment gateway error' },
        { status: 500 }
      )
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        txId,
        userId: user.id,
        addressId: addressRecord.id,
        amount: finalAmount,
        total: totalWithFee,
        status: 'pending',
        qrString: qrString,
        payUrl: payUrl,
        expiredAt: expiredAt,
        items: {
          create: items.map((item: OrderItem) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            price: items.find((i: OrderItem) => i.productId === item.productId)?.quantity || 0,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json({
      id: order.id,
      txId: order.txId,
      amount: order.amount,
      status: order.status,
      qrString: order.qrString,
      payUrl: order.payUrl,
      expiredAt: order.expiredAt,
      paidAt: order.paidAt,
      items: productDetails,
    })
  } catch (error) {
    console.error('[QRIS] Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


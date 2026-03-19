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

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items } = body // items: [{productId, quantity, size, color}, ...]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing items' }, { status: 400 })
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

    // Create order ID
    const txId = `TX${Date.now()}${Math.random().toString(36).substr(2, 9)}`

    // Create QRIS via PayDigital API
    let qrString = ''
    let payUrl = ''
    let qrisData = null

    try {
      const paydigitalResponse = await fetch(
        'https://api.paydigital.id/v1/qris/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.PAYDIGITAL_API_KEY}`,
          },
          body: JSON.stringify({
            externalId: txId,
            amount: totalAmount,
            description: `Fashion Store Order - ${productDetails.map(p => p.name).join(', ')}`,
            expiredTime: 600, // 10 minutes
            buyer: {
              name: 'Customer',
              email: 'customer@fashionstore.local',
            },
          }),
        }
      )

      if (paydigitalResponse.ok) {
        qrisData = await paydigitalResponse.json()
        qrString = qrisData.qrImage || qrisData.qrString || ''
        payUrl = qrisData.paymentLink || qrisData.payUrl || ''
      } else {
        console.error('[QRIS] PayDigital API error:', await paydigitalResponse.text())
        // Fallback to local QR generation
        const qrData = JSON.stringify({ 
          txId, 
          items: productDetails, 
          amount: totalAmount 
        })
        qrString = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`
      }
    } catch (error) {
      console.error('[QRIS] PayDigital API call error:', error)
      // Fallback to local QR generation
      const qrData = JSON.stringify({ 
        txId, 
        items: productDetails, 
        amount: totalAmount 
      })
      qrString = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`
    }

    // Create order in database
    const order = await prisma.order.create({
      data: {
        txId,
        userId: user.id,
        amount: totalAmount,
        total: totalAmount,
        status: 'pending',
        qrString: qrString,
        payUrl: payUrl,
        expiredAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
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


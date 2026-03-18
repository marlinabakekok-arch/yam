import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()

    // Get active flash sales
    const flashSales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gt: now },
      },
      orderBy: { endTime: 'asc' },
      take: 6,
    })

    // Get product details for each flash sale
    const salesWithProducts = await Promise.all(
      flashSales.map(async (sale) => {
        const product = await prisma.product.findUnique({
          where: { id: sale.productId },
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            stock: true,
          },
        })

        return {
          ...sale,
          product,
          originalPrice: product?.price || 0,
          discountedPrice: Math.floor(
            ((product?.price || 0) * (100 - sale.discount)) / 100
          ),
          timeLeft: Math.max(0, sale.endTime.getTime() - now.getTime()),
          soldPercentage:
            sale.maxQuantity && sale.maxQuantity > 0
              ? Math.round((sale.sold / sale.maxQuantity) * 100)
              : 0,
        }
      })
    )

    return NextResponse.json(salesWithProducts)
  } catch (error) {
    console.error('[FlashSales] Error:', error)
    return NextResponse.json([])
  }
}

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { id } = await params
    const { category } = await req.json()

    // Fetch product
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Generate description based on category and product name
    const descriptions: Record<string, string> = {
      fashion: `Discover the perfect ${product.name}. Crafted with premium materials and attention to detail, this ${category} item is designed for comfort and style. Whether you're heading to work or out for the weekend, this versatile piece complements any wardrobe. Features high-quality construction that withstands daily wear while maintaining its shape and color. Perfect for those who appreciate quality fashion.`,
      kalung: `Elevate your accessory game with this stunning ${product.name}. This exquisite jewelry piece is crafted to perfection, featuring elegant design and premium materials. Whether worn for everyday elegance or special occasions, it makes a timeless statement. Each piece is carefully crafted to ensure durability and lasting beauty. A must-have addition to any jewelry collection.`,
    }

    const generatedDescription =
      descriptions[category] ||
      descriptions.fashion

    // Update product with new description
    const updated = await prisma.product.update({
      where: { id },
      data: {
        description: generatedDescription,
      },
    })

    return NextResponse.json({
      success: true,
      description: generatedDescription,
      product: updated,
    })
  } catch (error) {
    console.error('[AI Description Error]:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}

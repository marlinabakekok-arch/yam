import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get popular products - just get recent products for now
    // Once migration runs, this will use _count for view tracking
    const recommendations = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 12,
    })

    // Transform to match expected format
    const formattedRecommendations = recommendations.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      images: product.images,
      category: product.category,
      popularity: Math.random() * 100, // Placeholder until migration runs
    }))

    return NextResponse.json(formattedRecommendations)
  } catch (error) {
    console.error('Fetch recommendations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

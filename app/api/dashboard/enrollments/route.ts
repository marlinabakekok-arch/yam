import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json([])
    }

    const enrollments = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        status: 'success',
      },
      include: {
        kelas: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    })

    return NextResponse.json(enrollments)
  } catch (error) {
    console.error('[v0] Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

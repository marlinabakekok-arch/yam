import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    })

    if (!user) {
      return NextResponse.json({ role: 'user' })
    }

    return NextResponse.json({ role: user.role })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ role: 'user' })
  }
}

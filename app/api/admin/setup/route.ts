import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, setupKey } = await req.json()

    // Verify setup key from environment
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json(
        { error: 'Invalid setup key' },
        { status: 401 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please sign up first, then try again.' },
        { status: 404 }
      )
    }

    // Make user admin
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' },
    })

    return NextResponse.json({
      success: true,
      message: `${email} is now an admin!`,
      user: updated,
    })
  } catch (error) {
    console.error('[Admin Setup Error]:', error)
    return NextResponse.json(
      { error: 'Failed to setup admin' },
      { status: 500 }
    )
  }
}

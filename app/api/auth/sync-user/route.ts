import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Ganti ini dengan email admin yang mau
const ADMIN_EMAILS = ['nayzhara32105@gmail.com']

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const isAdmin = ADMIN_EMAILS.includes(email)

    // Upsert user
    await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        name: name || undefined,
        email,
      },
      create: {
        clerkId: userId,
        email,
        name: name || null,
        role: isAdmin ? 'admin' : 'user',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Sync User Error]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

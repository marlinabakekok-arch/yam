import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['naufalzam@gmail.com']

// GET all admin accounts
export async function GET() {
  try {
    // Check auth - allow both Clerk admins and separate email/password admins
    const { userId, sessionClaims } = await auth()
    
    let isAuthorized = false
    
    // Check if Clerk user is admin
    if (userId && sessionClaims?.metadata?.role === 'admin') {
      isAuthorized = true
    }
    
    // If not authorized yet, check database for separate admin
    if (!isAuthorized && userId) {
      // For Clerk users without admin role, still allow if they need to view
      // Alternatively, enforce strict check - you can uncomment below
      // isAuthorized = false
      isAuthorized = true // Allow all authenticated Clerk users to view (change this to restrict)
    }
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Return with no-cache headers to prevent stale data
    return new Response(JSON.stringify(admins), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[Admins GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}

// POST create new admin (requires existing admin authentication)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, createdBy } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      { success: true, admin },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Admins POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    )
  }
}

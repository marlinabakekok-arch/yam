import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Fetch addresses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await request.json()

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        name: body.name,
        fullName: body.fullName,
        phone: body.phone,
        address: body.address,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
        isDefault: body.isDefault || false,
      },
    })

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    console.error('Create address error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get('id')

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }

    // Verify the address belongs to the current user
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    })

    if (!address || address.userId !== user.id) {
      return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 404 })
    }

    await prisma.address.delete({
      where: { id: addressId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete address error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get('id')
    const body = await request.json()

    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }

    // Verify the address belongs to the current user
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    })

    if (!address || address.userId !== user.id) {
      return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 404 })
    }

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      })
    }

    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        name: body.name ?? address.name,
        fullName: body.fullName ?? address.fullName,
        phone: body.phone ?? address.phone,
        address: body.address ?? address.address,
        city: body.city ?? address.city,
        province: body.province ?? address.province,
        postalCode: body.postalCode ?? address.postalCode,
        isDefault: body.isDefault !== undefined ? body.isDefault : address.isDefault,
      },
    })

    return NextResponse.json(updatedAddress)
  } catch (error) {
    console.error('Update address error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

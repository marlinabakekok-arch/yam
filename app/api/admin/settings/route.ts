import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET all settings
export async function GET() {
  try {
    const settings = await prisma.settings.findMany()

    // Convert to object format for easier use
    const settingsObj = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      },
      {} as Record<string, string>
    )

    return NextResponse.json(settingsObj)
  } catch (error) {
    console.error('[Settings GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT update settings
export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const updated = []

    for (const [key, value] of Object.entries(body)) {
      const setting = await prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
      updated.push(setting)
    }

    return NextResponse.json({ success: true, settings: updated })
  } catch (error) {
    console.error('[Settings PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

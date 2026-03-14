import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // TODO: Implement ZIP upload after Vercel deployment
  return NextResponse.json(
    { error: 'ZIP upload feature coming soon' },
    { status: 503 }
  )
}

/*
import { auth } from '@clerk/nextjs/server'
import { writeFile, mkdir, readdir } from 'fs/promises'
import { createReadStream, createWriteStream, existsSync } from 'fs'
import { join } from 'path'

// Dynamic import untuk unzipper
const unzipper = () => import('unzipper')

export async function POST_DISABLED(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate zip file
    if (!file.name.endsWith('.zip') && file.type !== 'application/zip') {
      return NextResponse.json({ error: 'File must be a ZIP archive' }, { status: 400 })
    }

    return NextResponse.json({
      message: 'ZIP upload will be implemented soon',
    })
  } catch (error) {
    console.error('[v0] Zip upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process ZIP file' },
      { status: 500 }
    )
  }
}
*/

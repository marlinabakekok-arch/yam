import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { createReadStream } from 'fs'
import { join } from 'path'
import { existsSync } from 'fs'
import unzipper from 'unzipper'
import { createWriteStream } from 'fs'

export async function POST(request: NextRequest) {
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

    // Create unique folder for extraction
    const timestamp = Date.now()
    const extractFolder = `extracted-${timestamp}-${Math.random().toString(36).substr(2, 9)}`
    const uploadsDir = join(process.cwd(), 'public/uploads')
    const extractPath = join(uploadsDir, extractFolder)

    // Create directories
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    await mkdir(extractPath, { recursive: true })

    // Save zip file temporarily
    const tempZipPath = join(uploadsDir, `${timestamp}.zip`)
    const buffer = await file.arrayBuffer()
    await writeFile(tempZipPath, Buffer.from(buffer))

    // Extract zip
    const extractedFiles: string[] = []
    await new Promise((resolve, reject) => {
      createReadStream(tempZipPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .on('close', () => {
          resolve(null)
        })
        .on('error', reject)
    })

    // Get list of extracted files
    const { readdirSync } = await import('fs')
    const listFiles = (dir: string, prefix = ''): string[] => {
      const files: string[] = []
      try {
        const items = readdirSync(dir, { withFileTypes: true })
        for (const item of items) {
          const fullPath = join(dir, item.name)
          const urlPath = `/uploads/${extractFolder}${prefix}/${item.name}`.replace(/\\/g, '/')
          if (item.isDirectory()) {
            files.push(...listFiles(fullPath, `${prefix}/${item.name}`))
          } else {
            files.push(urlPath)
            extractedFiles.push(urlPath)
          }
        }
      } catch (e) {
        console.error('Error reading directory:', e)
      }
      return files
    }

    listFiles(extractPath)

    // Clean up temp zip file
    const { unlinkSync } = await import('fs')
    try {
      unlinkSync(tempZipPath)
    } catch (e) {
      console.error('Error deleting temp zip:', e)
    }

    return NextResponse.json({
      folderName: extractFolder,
      files: extractedFiles,
      message: `Extracted ${extractedFiles.length} files`,
    })
  } catch (error) {
    console.error('[v0] Zip upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload and extract ZIP file' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'public', 'admin-data.json')

async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading data file:', error)
    return null
  }
}

async function writeData(data: any) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
    return true
  } catch (error) {
    console.error('Error writing data file:', error)
    return false
  }
}

// GET all data
export async function GET() {
  const data = await readData()
  if (!data) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 })
  }
  return NextResponse.json(data)
}

// POST add/update class
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = await readData()

    if (!data) {
      return NextResponse.json({ error: 'Failed to read data' }, { status: 500 })
    }

    const { action, payload } = body

    if (action === 'addClass') {
      const newClass = {
        id: Date.now().toString(),
        ...payload,
        students: 0,
        revenue: 0,
        createdAt: new Date().toISOString().split('T')[0],
      }
      data.classes.push(newClass)
      data.stats.totalClasses = data.classes.length
    } else if (action === 'updateClass') {
      const index = data.classes.findIndex((c: any) => c.id === payload.id)
      if (index !== -1) {
        data.classes[index] = { ...data.classes[index], ...payload }
      }
    } else if (action === 'deleteClass') {
      data.classes = data.classes.filter((c: any) => c.id !== payload.id)
      data.stats.totalClasses = data.classes.length
    }

    const success = await writeData(data)
    if (!success) {
      return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

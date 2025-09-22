import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const RESUMES_DIR = path.join(process.cwd(), 'public', 'resumes')

export async function GET() {
  try {
    // Ensure the resumes directory exists
    await fs.mkdir(RESUMES_DIR, { recursive: true })
    
    const files = await fs.readdir(RESUMES_DIR)
    const resumes = []

    for (const filename of files) {
      if (filename.endsWith('.pdf')) {
        const filePath = path.join(RESUMES_DIR, filename)
        const stats = await fs.stat(filePath)
        
        resumes.push({
          filename,
          displayName: filename.replace('.pdf', '').replace(/-/g, ' '),
          size: stats.size,
          uploadedAt: stats.mtime
        })
      }
    }

    // Sort by upload date, newest first
    resumes.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    return NextResponse.json(resumes)
  } catch (error) {
    console.error('Error fetching resumes:', error)
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const displayName = formData.get('displayName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!displayName) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
    }

    // Ensure the resumes directory exists
    await fs.mkdir(RESUMES_DIR, { recursive: true })

    // Create a safe filename
    const safeDisplayName = displayName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-')
    const timestamp = Date.now()
    const filename = `${safeDisplayName}-${timestamp}.pdf`
    const filePath = path.join(RESUMES_DIR, filename)

    // Save the file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(filePath, buffer)

    return NextResponse.json({
      filename,
      displayName,
      size: file.size,
      uploadedAt: new Date()
    })
  } catch (error) {
    console.error('Error uploading resume:', error)
    return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { join } from 'path'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) {
  const filename = params.filename
  const filePath = join(process.cwd(), 'public', 'uploads', filename)

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  try {
    const fileBuffer = await readFile(filePath)
    
    // Determine content type based on extension
    let contentType = 'application/octet-stream'
    const lowerName = filename.toLowerCase()
    if (lowerName.endsWith('.png')) contentType = 'image/png'
    else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) contentType = 'image/jpeg'
    else if (lowerName.endsWith('.gif')) contentType = 'image/gif'
    else if (lowerName.endsWith('.svg')) contentType = 'image/svg+xml'
    else if (lowerName.endsWith('.webp')) contentType = 'image/webp'
    else if (lowerName.endsWith('.pdf')) contentType = 'application/pdf'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}

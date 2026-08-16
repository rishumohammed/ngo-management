import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    if (!data.url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { assignments: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Permission check
    const isAdmin = session.user.role && session.user.role !== 'VOLUNTEER' && can(session.user.role, 'events', 'read')
    let isAssignedVolunteer = false

    if (session.user.isVolunteer || session.user.role === 'VOLUNTEER') {
      let volunteerId = session.user.volunteerId
      if (!volunteerId) {
        const v = await prisma.volunteer.findFirst({
          where: {
            OR: [
              { userId: session.user.id },
              { email: session.user.email || '' },
            ],
          },
        })
        if (v) volunteerId = v.id
      }
      isAssignedVolunteer = event.assignments.some(a => a.volunteerId === volunteerId)
    }

    if (!isAdmin && !isAssignedVolunteer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const newImage = {
      url: data.url,
      uploadedBy: session.user.name || session.user.email || 'Unknown',
      uploadedAt: new Date().toISOString(),
    }

    const existingImages = Array.isArray(event.images) ? event.images : []
    const updatedImages = [...existingImages, newImage]

    const updatedEvent = await prisma.event.update({
      where: { id: params.id },
      data: { images: updatedImages },
    })

    return NextResponse.json({ success: true, images: updatedEvent.images })
  } catch (error) {
    console.error('Failed to add event image:', error)
    return NextResponse.json({ error: 'Failed to add event image' }, { status: 500 })
  }
}

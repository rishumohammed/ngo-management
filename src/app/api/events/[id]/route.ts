import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'events', 'read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        assignments: {
          include: { volunteer: true }
        }
      }
    })

    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'events', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await req.json()
    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        name: data.name,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        location: data.location,
        description: data.description,
        status: data.status,
      }
    })

    await logAudit({
      userId: session.user.id,
      userName: session.user.name || 'Unknown',
      action: 'UPDATE',
      entity: 'Event',
      entityId: event.id,
      entityName: event.name,
    })

    return NextResponse.json(event)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'events', 'delete')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const event = await prisma.event.delete({
      where: { id: params.id },
    })

    await logAudit({
      userId: session.user.id,
      userName: session.user.name || 'Unknown',
      action: 'DELETE',
      entity: 'Event',
      entityId: event.id,
      entityName: event.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'minutes', 'read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const minute = await prisma.meetingMinute.findUnique({
      where: { id: params.id },
      include: {
        attendees: { include: { member: true } },
        agendaItems: { orderBy: { orderIndex: 'asc' } },
        actionItems: { orderBy: { createdAt: 'asc' } },
        addendums: { orderBy: { addedAt: 'asc' } },
        committee: true,
      },
    })

    if (!minute) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(minute)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'minutes', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const data = await req.json()

    // Prevent updates if finalized
    const current = await prisma.meetingMinute.findUnique({ where: { id: params.id } })
    if (!current || current.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Cannot edit finalized minutes' }, { status: 400 })
    }

    const minute = await prisma.meetingMinute.update({
      where: { id: params.id },
      data: {
        title: data.title,
        date: new Date(data.date),
        location: data.location,
        onlineLink: data.onlineLink,
      },
    })

    await logAudit({
      userId: session.user.id,
      userName: session.user.name || 'Unknown',
      action: 'UPDATE',
      entity: 'MeetingMinute',
      entityId: minute.id,
      entityName: minute.title,
    })

    return NextResponse.json(minute)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

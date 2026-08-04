import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'

export async function PUT(req: NextRequest, { params }: { params: { id: string, agendaId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'minutes', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const current = await prisma.meetingMinute.findUnique({ where: { id: params.id } })
    if (!current || current.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Cannot edit finalized minutes' }, { status: 400 })
    }

    const data = await req.json()
    const agendaItem = await prisma.agendaItem.update({
      where: { id: params.agendaId },
      data: {
        orderIndex: data.orderIndex,
        title: data.title,
        notes: data.notes,
        decisions: data.decisions,
      },
    })

    return NextResponse.json(agendaItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update agenda item' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, agendaId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !can(session.user.role, 'minutes', 'update')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const current = await prisma.meetingMinute.findUnique({ where: { id: params.id } })
    if (!current || current.status === 'FINALIZED') {
      return NextResponse.json({ error: 'Cannot edit finalized minutes' }, { status: 400 })
    }

    await prisma.agendaItem.delete({
      where: { id: params.agendaId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete agenda item' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logAudit } from '@/lib/audit'
import { can } from '@/lib/permissions'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const agendaItem = await prisma.agendaItem.create({
      data: {
        minuteId: params.id,
        orderIndex: data.orderIndex,
        title: data.title,
        notes: data.notes,
        decisions: data.decisions,
      },
    })

    return NextResponse.json(agendaItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create agenda item' }, { status: 500 })
  }
}
